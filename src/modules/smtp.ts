import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import { EventEmitter } from 'events';
import { config } from '../config.js';

export const mailEmitter = new EventEmitter();

const createServerOptions = (secure: boolean) => {
  const options: any = {
    authOptional: true,
    onData(stream: any, session: any, callback: any) {
      simpleParser(stream, (err, mail) => {
        if (err) {
          console.error('Mail parsing error:', err);
        } else {
          // Extract recipient shortid
          const to = (mail.to as any)?.text || '';
          const match = to.match(/([\w\._\-\+]+)@/i);
          if (match) {
            const shortid = match[1].toLowerCase();
            // Map ParsedMail to frontend structure
            const mailData = {
              headers: {
                from: (mail.from as any)?.text || 'Unknown Sender',
                to: (mail.to as any)?.text || '',
                subject: mail.subject || '(No Subject)',
                date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
              },
              html: mail.html || undefined,
              text: mail.text || undefined,
              attachments: mail.attachments?.map(att => ({
                filename: att.filename,
                contentType: att.contentType
              }))
            };
            mailEmitter.emit('mail', { shortid, mail: mailData });
          }
        }
        callback();
      });
    },
  };

  // Enable TLS/STARTTLS if configured
  if (config.smtp.keyPath && config.smtp.certPath) {
    try {
      options.key = fs.readFileSync(config.smtp.keyPath);
      options.cert = fs.readFileSync(config.smtp.certPath);
      options.secure = secure; // true for Implicit TLS, false for STARTTLS
    } catch (err) {
      console.error(`Failed to load SSL certificates for ${secure ? 'SMTPS' : 'SMTP'}:`, err);
    }
  }
  return options;
};

export const smtpServer = new SMTPServer(createServerOptions(false));
export const smtpsServer = (config.smtp.keyPath && config.smtp.certPath) 
  ? new SMTPServer(createServerOptions(true)) 
  : null;

export function startSmtp() {
  smtpServer.listen(config.smtp.port, config.smtp.host, () => {
    console.log(`SMTP Server (STARTTLS) listening on ${config.smtp.host}:${config.smtp.port}`);
  });

  if (smtpsServer) {
    smtpsServer.listen(config.smtp.smtpsPort, config.smtp.host, () => {
      console.log(`SMTPS Server (Implicit TLS) listening on ${config.smtp.host}:${config.smtp.smtpsPort}`);
    });
  }
}
