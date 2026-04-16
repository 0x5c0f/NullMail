import { SMTPServer } from 'smtp-server';
import { AddressObject, simpleParser } from 'mailparser';
import fs from 'fs';
import { EventEmitter } from 'events';
import { config } from '../config.js';
import { isValidShortid, normalizeShortid } from './mailbox.js';

export const mailEmitter = new EventEmitter();

interface SmtpSessionLike {
  shortids?: string[];
}

function createSmtpError(message: string, responseCode: number): Error {
  const error = new Error(message) as Error & { responseCode?: number };
  error.responseCode = responseCode;
  return error;
}

function getRecipientShortid(address: string): string | null {
  const [localPart = '', domain = ''] = address.trim().toLowerCase().split('@');
  const shortid = normalizeShortid(localPart);

  if (domain !== config.web.domain) {
    return null;
  }

  if (!isValidShortid(shortid) || config.blacklist.includes(shortid)) {
    return null;
  }

  return shortid;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getRecipientAddresses(addressObject: AddressObject | AddressObject[] | undefined): string[] {
  if (!addressObject) {
    return [];
  }

  const groups = Array.isArray(addressObject) ? addressObject : [addressObject];
  return groups.flatMap(group => group.value.map(entry => entry.address || ''));
}

function dedupeShortids(shortids: string[]): string[] {
  return Array.from(new Set(shortids));
}

const createServerOptions = (secure: boolean) => {
  const options: any = {
    authOptional: true,
    size: config.smtp.maxMessageSize,
    hideSTARTTLS: !config.smtp.hasTlsCredentials,
    onRcptTo(address: { address?: string }, session: SmtpSessionLike, callback: (error?: Error | null) => void) {
      const recipient = typeof address.address === 'string' ? address.address : '';
      const shortid = getRecipientShortid(recipient);

      if (!shortid) {
        callback(createSmtpError('Mailbox unavailable.', 553));
        return;
      }

      session.shortids = dedupeShortids([...(session.shortids ?? []), shortid]);
      callback();
    },
    onData(stream: any, session: SmtpSessionLike, callback: any) {
      simpleParser(stream, (err, mail) => {
        if (err) {
          console.error('Mail parsing error:', err);
          callback(createSmtpError('Failed to parse mail.', 451));
          return;
        }

        const envelopeRecipients = dedupeShortids(session.shortids ?? []);
        const recipients = envelopeRecipients.length > 0
          ? envelopeRecipients
          : dedupeShortids(
            getRecipientAddresses(mail.to)
              .map(address => getRecipientShortid(address))
              .filter((value): value is string => Boolean(value))
          );

        if (recipients.length === 0) {
          console.warn('Mail accepted but no deliverable recipients were found in SMTP envelope or headers.');
          callback();
          return;
        }

        if (envelopeRecipients.length === 0) {
          console.warn('Falling back to parsed mail headers for routing because SMTP envelope recipients were unavailable.');
        }

        const mailData = {
          headers: {
            from: (mail.from as any)?.text || 'Unknown Sender',
            to: (mail.to as any)?.text || '',
            subject: mail.subject || '(No Subject)',
            date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
          },
          html: toOptionalString(mail.html),
          text: toOptionalString(mail.text),
          attachments: mail.attachments?.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
          })),
        };

        for (const shortid of recipients) {
          mailEmitter.emit('mail', { shortid, mail: mailData });
        }

        console.log(`Mail routed to ${recipients.length} inbox(es): ${recipients.join(', ')}`);

        callback();
      });
    },
  };

  if (config.smtp.hasTlsCredentials && config.smtp.keyPath && config.smtp.certPath) {
    try {
      options.key = fs.readFileSync(config.smtp.keyPath);
      options.cert = fs.readFileSync(config.smtp.certPath);
      options.secure = secure;
    } catch (err) {
      console.error(`Failed to load TLS certificates for ${secure ? 'SMTPS' : 'SMTP'}:`, err);
      throw err;
    }
  }

  return options;
};

export const smtpServer = new SMTPServer(createServerOptions(false));
export const smtpsServer = config.smtp.hasTlsCredentials
  ? new SMTPServer(createServerOptions(true))
  : null;

export function startSmtp() {
  smtpServer.listen(config.smtp.port, config.smtp.host, () => {
    if (config.smtp.hasTlsCredentials) {
      console.log(`SMTP Server listening on ${config.smtp.host}:${config.smtp.port} with STARTTLS enabled`);
    } else {
      console.log(`SMTP Server listening on ${config.smtp.host}:${config.smtp.port} without TLS`);
    }
  });

  if (smtpsServer) {
    smtpsServer.listen(config.smtp.smtpsPort, config.smtp.host, () => {
      console.log(`SMTPS Server listening on ${config.smtp.host}:${config.smtp.smtpsPort}`);
    });
  } else {
    console.log('SMTPS Server disabled: TLS_KEY_PATH and TLS_CERT_PATH are not both configured.');
  }
}
