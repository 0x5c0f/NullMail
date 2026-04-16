import dotenv from 'dotenv';
import { AppConfig } from './types.js';

dotenv.config();

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseList(value: string | undefined, separator: string): string[] {
  return (value ?? '')
    .split(separator)
    .map(item => item.trim())
    .filter(Boolean);
}

const keyPath = process.env.TLS_KEY_PATH?.trim();
const certPath = process.env.TLS_CERT_PATH?.trim();
const hasTlsCredentials = Boolean(keyPath && certPath);

export const config: AppConfig = {
  smtp: {
    port: parseInteger(process.env.SMTP_PORT, 25),
    smtpsPort: parseInteger(process.env.SMTPS_PORT, 465),
    host: process.env.SMTP_HOST || '0.0.0.0',
    keyPath,
    certPath,
    hasTlsCredentials,
    maxMessageSize: parseInteger(process.env.SMTP_MAX_SIZE, 10 * 1024 * 1024),
  },
  web: {
    port: parseInteger(process.env.PORT, 3000),
    domain: (process.env.DOMAIN || 'localhost').trim().toLowerCase(),
    allowedOrigins: parseList(process.env.ALLOWED_ORIGINS, ','),
  },
  blacklist: parseList(process.env.KEYWORD_BLACKLIST, ',').map(item => item.toLowerCase()),
  securityNotice: process.env.SECURITY_NOTICE ? parseList(process.env.SECURITY_NOTICE, '|') : undefined,
};
