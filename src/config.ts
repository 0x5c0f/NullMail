import dotenv from 'dotenv';
import { AppConfig } from './types.js';

dotenv.config();

export const config: AppConfig = {
  smtp: {
    port: parseInt(process.env.SMTP_PORT || '25', 10),
    smtpsPort: parseInt(process.env.SMTPS_PORT || '465', 10),
    host: process.env.SMTP_HOST || '0.0.0.0',
    tls: process.env.SMTP_TLS === 'true',
    keyPath: process.env.TLS_KEY_PATH,
    certPath: process.env.TLS_CERT_PATH,
  },
  web: {
    port: parseInt(process.env.PORT || '3000', 10),
    domain: process.env.DOMAIN || 'localhost',
  },
  blacklist: (process.env.KEYWORD_BLACKLIST || '').split(',').map(s => s.trim()).filter(Boolean),
  securityNotice: process.env.SECURITY_NOTICE ? process.env.SECURITY_NOTICE.split('|').map(s => s.trim()) : undefined,
};
