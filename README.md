# NullMail 🚀 - 极简隐私临时邮箱服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)

**NullMail** 是一款注重隐私、无状态且极简的临时邮箱服务。它提供实时的 Web 界面，让你可以即时接收邮件，且**不在服务器上存储任何数据**。

---

## ✨ 核心特性

- **无状态架构 (Stateless)**：无数据库，无持久化存储。邮件通过 Socket.io 直接流式传输到客户端，仅保留在内存中，刷新即消失。
- **实时 Web 界面**：基于 React 和 Tailwind CSS 构建，使用 Framer Motion 实现流畅的动画效果。
- **工业级安全防护**：
  - **DOMPurify**：对接收到的 HTML 进行深度清洗，有效防止 XSS 攻击。
  - **沙箱化渲染**：邮件内容在严格限制的 `iframe` 中通过客户端 `blob:` URL 渲染。
  - **严格 CSP 策略**：在邮件预览中强制执行内容安全策略 (CSP)，彻底禁止任何脚本执行。
- **SMTP 支持**：内置 SMTP 服务器，支持 STARTTLS 加密。
- **高度可定制**：轻松配置域名、关键字黑名单和安全提示信息。

---

## 🏗️ 架构原理

NullMail 的设计核心是最大化隐私保护：
1. **SMTP 接收**：服务器通过 SMTP 协议接收邮件。
2. **实时转发**：邮件被解析后，立即通过 Socket.io 广播给特定的客户端。
3. **客户端渲染**：客户端接收邮件，使用 `DOMPurify` 进行清洗，并利用本地 `blob:` URL 在沙箱化的 `iframe` 中渲染。
4. **不留痕迹**：一旦客户端断开连接或刷新页面，邮件将永久消失。服务器从不将邮件内容写入磁盘。

---

## 🚀 快速开始

### 前置要求

- Node.js v20 或更高版本
- npm 或 yarn

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/0x5c0f/NullMail.git
   cd NullMail
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量（见下文）。

4. 编译并启动：
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ 配置说明

在根目录下创建 `.env` 文件。你可以参考 `.env.example` 作为模板。

### 环境变量

| 变量名 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PORT` | `3000` | Web 界面和 Socket.io 服务器监听的端口。 |
| `SMTP_PORT` | `2525` | SMTP 服务器监听的端口。 |
| `SMTP_HOST` | `0.0.0.0` | SMTP 服务器绑定的主机地址。 |
| `SMTP_TLS` | `false` | 是否启用 STARTTLS 支持（需要证书）。 |
| `TLS_KEY_PATH` | - | SSL 私钥路径 (例如 `privkey.pem`)。 |
| `TLS_CERT_PATH` | - | SSL 证书路径 (例如 `fullchain.pem`)。 |
| `DOMAIN` | `localhost` | 你的邮箱域名后缀 (例如 `mail.example.com`)。 |
| `ALLOWED_ORIGINS` | - | CORS 允许的域名列表（逗号分隔）。 |
| `KEYWORD_BLACKLIST` | `admin,root...` | 禁止使用的邮箱前缀 (例如 `admin@yourdomain.com`)。 |
| `SECURITY_NOTICE` | - | UI 中显示的自定义安全提示（使用 `\|` 分隔）。 |

---

## 🛡️ 安全细节

- **Iframe 沙箱**：邮件预览 `iframe` 使用了 `sandbox="allow-popups allow-popups-to-escape-sandbox"`。它明确排除了 `allow-scripts` 和 `allow-same-origin`，以确保完全的隔离。
- **Blob URL**：邮件通过 `URL.createObjectURL(blob)` 渲染，这被浏览器视为一个唯一的起源，防止其访问主应用的任何上下文。
- **CSP 策略**：注入的 `<meta http-equiv="Content-Security-Policy">` 拦截所有脚本，但允许来自 `http:`、`https:` 和 `data:` 源的图片。

---

## 🌐 DNS 配置

为了从互联网接收邮件，你需要配置 DNS 记录：
1. **A 记录**：`mail.yourdomain.com` -> `你的服务器公网 IP`
2. **MX 记录**：`@` -> `mail.yourdomain.com` (优先级 10)

---

## 📄 开源协议

本项目基于 MIT 协议开源。

