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
    tls: boolean;
    keyPath?: string;
    certPath?: string;
  };
  web: {
    port: number;
    domain: string;
  };
  blacklist: string[];
  securityNotice?: string[];
}
