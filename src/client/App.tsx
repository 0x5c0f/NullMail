import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mail, RefreshCw, Copy, Trash2, ChevronRight, Inbox, Clock, User, Tag, Globe, Edit3, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GitHubCorner from './components/GitHubCorner';
import DOMPurify from 'dompurify';

interface MailHeader {
  from: string;
  to: string;
  subject: string;
  date: string;
}

interface MailData {
  headers: MailHeader;
  html?: string;
  text?: string;
  attachments?: any[];
}

// i18n Translations
const translations = {
  en: {
    title: "NullMail",
    subtitle: "v1.0",
    tempAddress: "Your Temporary Email Address",
    changeId: "Change ID",
    customId: "Custom ID",
    copy: "Copy email address",
    securityNotice: "IMPORTANT SECURITY NOTICE:",
    risk1: "This is a **disposable** service. Emails are stored in your browser's local storage for persistence across refreshes.",
    risk2: "Anyone with your short ID can access your inbox. Do not use this for sensitive accounts.",
    risk3: "This service is for testing and temporary use only. No long-term cloud storage is provided.",
    inbox: "Incoming Messages",
    clearAll: "Clear All",
    emptyInbox: "Your inbox is empty",
    waiting: "Waiting for emails to arrive at your temporary address...",
    selectMail: "Select an email to read",
    from: "From",
    received: "Received",
    attachments: "Attachments",
    footer: "A minimalist disposable mail service.",
    motto: '"Minimalist, disposable, secure."',
    deleteMail: "Delete this email",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    invalidId: "Invalid ID (3-20 chars, alphanumeric only)"
  },
  zh: {
    title: "空邮件",
    subtitle: "v1.0",
    tempAddress: "您的临时邮箱地址",
    changeId: "随机切换",
    customId: "自定义 ID",
    copy: "复制邮箱地址",
    securityNotice: "重要安全须知：",
    risk1: "这是一个**临时**服务。邮件保存在浏览器本地存储中，刷新页面不会丢失。",
    risk2: "任何知道您 ID 的人都可以访问您的收件箱。请勿用于敏感账户。",
    risk3: "本服务仅供测试和临时使用。不提供长期云端存储。",
    inbox: "收件箱",
    clearAll: "清空全部",
    emptyInbox: "收件箱为空",
    waiting: "正在等待发送到您临时地址的邮件...",
    selectMail: "选择一封邮件进行阅读",
    from: "发件人",
    received: "接收时间",
    attachments: "附件",
    footer: "极简的临时邮箱服务。",
    motto: "“极简，临时，安全。”",
    deleteMail: "删除此邮件",
    error: "错误",
    save: "保存",
    cancel: "取消",
    invalidId: "无效 ID (3-20位，仅限字母数字)"
  }
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [shortid, setShortid] = useState<string>('');
  const [mails, setMails] = useState<MailData[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [isEditingId, setIsEditingId] = useState(false);
  const [editIdValue, setEditIdValue] = useState('');
  const [customSecurityNotice, setCustomSecurityNotice] = useState<string[] | null>(null);

  const t = translations[lang];

  // Fetch Custom Config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.securityNotice && Array.isArray(data.securityNotice)) {
          setCustomSecurityNotice(data.securityNotice);
        }
      })
      .catch(err => console.error("Failed to fetch config:", err));
  }, []);

  // Initialize Language
  useEffect(() => {
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    const savedLang = localStorage.getItem('lang') as 'en' | 'zh';
    setLang(savedLang || browserLang);
  }, []);

  // Sync Language to LocalStorage
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Load Mails from LocalStorage
  useEffect(() => {
    const savedMails = localStorage.getItem('cached_mails');
    if (savedMails) {
      try {
        setMails(JSON.parse(savedMails));
      } catch (e) {
        console.error("Failed to parse cached mails");
      }
    }
  }, []);

  // Sync Mails to LocalStorage
  useEffect(() => {
    localStorage.setItem('cached_mails', JSON.stringify(mails));
  }, [mails]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      const savedId = localStorage.getItem('shortid');
      if (savedId) {
        newSocket.emit('set shortid', savedId);
      } else {
        const randomId = Math.random().toString(36).substring(2, 10);
        newSocket.emit('set shortid', randomId);
      }
    });

    newSocket.on('shortid_ready', (id: string) => {
      setShortid(id);
      localStorage.setItem('shortid', id);
      setError(null);
      setIsEditingId(false);
    });

    newSocket.on('mail', (mail: MailData) => {
      setMails(prev => {
        const updated = [mail, ...prev];
        // Keep only last 50 mails to avoid localStorage bloat
        return updated.slice(0, 50);
      });
      
      if (Notification.permission === 'granted') {
        new Notification(`New mail from ${mail.headers.from}`, {
          body: mail.headers.subject
        });
      }
    });

    newSocket.on('error', (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const copyToClipboard = () => {
    const email = `${shortid}@${window.location.hostname}`;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshId = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    socket?.emit('set shortid', randomId);
    setMails([]);
    localStorage.removeItem('cached_mails');
    setSelectedMail(null);
  };

  const handleCustomIdSubmit = () => {
    if (editIdValue.length < 3 || editIdValue.length > 20 || !/^[a-z0-9]+$/i.test(editIdValue)) {
      setError(t.invalidId);
      return;
    }
    socket?.emit('set shortid', editIdValue.toLowerCase());
  };

  const clearAllMails = () => {
    setMails([]);
    localStorage.removeItem('cached_mails');
    setSelectedMail(null);
  };

  const [mailBlobUrl, setMailBlobUrl] = useState<string | null>(null);

  // Cleanup Blob URL
  useEffect(() => {
    return () => {
      if (mailBlobUrl) URL.revokeObjectURL(mailBlobUrl);
    };
  }, [mailBlobUrl]);

  useEffect(() => {
    if (selectedMail?.html) {
      // 1. Sanitize the email body with DOMPurify
      const sanitizedBody = DOMPurify.sanitize(selectedMail.html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'object', 'embed', 'iframe', 'applet', 'meta', 'link', 'base'],
        FORBID_ATTR: ['on*'],
      });

      // 2. Wrap it in a clean, script-free HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https: data:; style-src 'unsafe-inline' http: https:; font-src http: https:;">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                line-height: 1.6; 
                color: #374151; 
                padding: 20px; 
                margin: 0;
              }
              img { max-width: 100%; height: auto; border-radius: 8px; }
              a { color: #4f46e5; text-decoration: underline; }
            </style>
          </head>
          <body>
            <div id="mail-content">${sanitizedBody}</div>
          </body>
        </html>
      `;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      if (mailBlobUrl) URL.revokeObjectURL(mailBlobUrl);
      setMailBlobUrl(url);
    } else {
      setMailBlobUrl(null);
    }
  }, [selectedMail]);

  const sanitizeHtml = (html: string) => {
    // This is now just a wrapper around DOMPurify for consistency
    return DOMPurify.sanitize(html);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <GitHubCorner href="https://github.com/0x5c0f/NullMail.git" />
      {/* Header / Branding */}
      <header className="py-6 px-6 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 italic">{t.title} <span className="text-indigo-600 font-mono text-sm not-italic ml-1 opacity-70">{t.subtitle}</span></h1>
        </div>

        <button 
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Globe size={16} />
          <span>{lang === 'en' ? '中文' : 'English'}</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pb-12">
        {/* Hero Section: The Email Address */}
        <section className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.tempAddress}</h2>
          
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl px-6 py-4 flex items-center gap-3 group hover:border-indigo-300 transition-colors w-full md:w-auto">
                {isEditingId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      autoFocus
                      type="text"
                      value={editIdValue}
                      onChange={(e) => setEditIdValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomIdSubmit()}
                      className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xl font-mono text-indigo-600 outline-none focus:ring-2 ring-indigo-100 w-full"
                      placeholder="custom-id"
                    />
                    <button onClick={handleCustomIdSubmit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title={t.save}><Check size={20} /></button>
                    <button onClick={() => setIsEditingId(false)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t.cancel}><X size={20} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl md:text-3xl font-mono font-medium text-gray-800 break-all">
                      {shortid}@{window.location.hostname}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-500 hover:text-indigo-600"
                        title={t.copy}
                      >
                        <Copy size={24} className={copied ? "text-green-500" : ""} />
                      </button>
                      <button 
                        onClick={() => { setEditIdValue(shortid); setIsEditingId(true); }}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-500 hover:text-indigo-600"
                        title={t.customId}
                      >
                        <Edit3 size={24} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={refreshId}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl font-bold text-lg active:scale-95 whitespace-nowrap"
              >
                <RefreshCw size={20} className={socket?.connected ? "" : "animate-spin"} />
                <span>{t.changeId}</span>
              </button>
            </div>
          </div>

          {/* Risk Warning / Disclaimer */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-left">
            <div className="text-amber-600 mt-0.5">
              <Clock size={18} />
            </div>
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">⚠️ {t.securityNotice}</p>
              <ul className="list-disc list-inside space-y-1 opacity-80">
                {customSecurityNotice ? (
                  customSecurityNotice.map((notice, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: notice }}></li>
                  ))
                ) : (
                  <>
                    <li dangerouslySetInnerHTML={{ __html: t.risk1 }}></li>
                    <li>{t.risk2}</li>
                    <li>{t.risk3}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Inbox Section */}
        <section className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Inbox size={20} className="text-indigo-600" />
              {t.inbox}
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full ml-2">{mails.length}</span>
            </h3>
            {mails.length > 0 && (
              <button 
                onClick={clearAllMails}
                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors"
              >
                {t.clearAll}
              </button>
            )}
          </div>

          <div className="min-h-[300px]">
            {mails.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-gray-50 p-6 rounded-full mb-6"
                >
                  <Inbox size={48} className="text-gray-200" />
                </motion.div>
                <p className="text-lg font-medium text-gray-500">{t.emptyInbox}</p>
                <p className="text-sm mt-2 max-w-xs">{t.waiting}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {mails.map((mail, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <button
                        onClick={() => setSelectedMail(mail)}
                        className="w-full text-left p-6 hover:bg-indigo-50/30 transition-all flex items-start gap-4"
                      >
                        <div className="bg-gray-100 group-hover:bg-white p-3 rounded-xl text-gray-400 group-hover:text-indigo-600 transition-colors">
                          <Mail size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900 truncate">
                              {(mail.headers.from || 'Unknown Sender').split('<')[0].trim()}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {mail.headers.date ? new Date(mail.headers.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-700 truncate mb-1">{mail.headers.subject || '(No Subject)'}</div>
                          <div className="text-xs text-gray-400 truncate opacity-70">{mail.text?.substring(0, 100)}</div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 mt-1 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mail Detail Modal / Overlay */}
      <AnimatePresence>
        {selectedMail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMail(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-gray-900/60 backdrop-blur-sm cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setMails(prev => prev.filter(m => m !== selectedMail));
                      setSelectedMail(null);
                    }}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                    title={t.deleteMail}
                  >
                    <Trash2 size={20} />
                  </button>
                  <h3 className="font-bold text-gray-900 truncate max-w-md">{selectedMail.headers.subject || '(No Subject)'}</h3>
                </div>
                <button 
                  onClick={() => setSelectedMail(null)}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl text-gray-500 transition-colors"
                >
                  <ChevronRight size={20} className="rotate-90 md:rotate-0" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="mb-10 pb-8 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t.from}</div>
                        <div className="text-sm font-bold text-gray-800">{selectedMail.headers.from}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2.5 rounded-2xl text-gray-600">
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t.received}</div>
                        <div className="text-sm font-bold text-gray-800">{new Date(selectedMail.headers.date).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prose prose-indigo max-w-none">
                  {selectedMail.html ? (
                    <iframe 
                      src={mailBlobUrl || undefined}
                      className="w-full h-[600px] border-none rounded-2xl bg-white transition-all duration-300 shadow-inner"
                      title="Email Content"
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      {selectedMail.text}
                    </pre>
                  )}
                </div>

                {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                  <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Tag size={14} />
                      {t.attachments} ({selectedMail.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedMail.attachments.map((att, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-default">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          {att.filename || 'Unnamed file'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]">
          <Trash2 size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-xs">
        <p>© 2026 {t.title} 🌌 - {t.footer}</p>
        <p className="mt-1 opacity-50 italic">{t.motto}</p>
      </footer>
    </div>
  );
};

export default App;
