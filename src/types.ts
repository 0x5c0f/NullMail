import { ParsedMail } from 'mailparser';

export interface MailMessage extends ParsedMail {
  id: string;
  receivedAt: Date;
}

export interface AppConfig {
  smtp: {
    port: number;
    smtpsPort: number;
    host: string;
    keyPath?: string;
    certPath?: string;
    hasTlsCredentials: boolean;
    maxMessageSize: number;
  };
  web: {
    port: number;
    domain: string;
    allowedOrigins: string[];
  };
  blacklist: string[];
  securityNotice?: string[];
}
