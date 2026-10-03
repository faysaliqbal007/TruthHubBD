# 🛡️ TruthHubBD — Bangladesh Trust Layer & Review System

[![Live Application](https://img.shields.io/badge/Live-truthhub.austattendance.online-success?style=for-the-badge&logo=nginx)](https://truthhub.austattendance.online/)
[![Deploy to VPS](https://img.shields.io/github/actions/workflow/status/faysaliqbal007/TruthHubBD/deploy.yml?branch=main&style=for-the-badge&label=CI%2FCD%20Deploy)](https://github.com/faysaliqbal007/TruthHubBD/actions/workflows/deploy.yml)

**TruthHubBD** is a modern community review, canonical entity discovery, and fraud prevention platform built specifically for Bangladesh. It features verified user authentication, strict token security, structured multi-dimension reviews, ClamAV upload malware scanning, and a high-performance modern stack.

- **Live Application**: [https://truthhub.austattendance.online/](https://truthhub.austattendance.online/)
- **Health & Version Endpoint**: [https://truthhub.austattendance.online/api/health](https://truthhub.austattendance.online/api/health)
- **Application Status**: [https://truthhub.austattendance.online/up](https://truthhub.austattendance.online/up)
- **Repository**: [https://github.com/faysaliqbal007/TruthHubBD](https://github.com/faysaliqbal007/TruthHubBD)

---

## 📁 Repository Architecture

```text
TruthHubBD/
├── 🌐 frontend/                  React 19 / TypeScript / Vite 8 / Tailwind CSS 4
│   ├── src/
│   │   ├── components/           Clean UI component library & modals
│   │   ├── features/             Sanctum session-aware AuthContext & guards
│   │   ├── services/             API services (api, business, reviews, cases)
│   │   ├── i18n/                 Bengali & English bilingual dictionary
│   │   └── types.ts              Shared TypeScript data definitions
│   ├── public/                   Static assets, icons & favicons
│   ├── package.json              Dependencies & Vite build scripts
│   └── vite.config.ts            Vite configuration with /app/ asset base
│
├── ⚙️ backend/                   Laravel 12 REST API & Security Core (PHP 8.4)
│   ├── app/Http/Controllers/     API, Auth, Google OAuth & Admin controllers
│   ├── app/Http/Middleware/      Sanctum, MFA, Account Restriction & ScanUploads
│   ├── app/Models/               Eloquent models (Business, Review, ScamCase, etc.)
│   ├── config/                   CORS, Mail, Session, Database configuration
│   ├── database/migrations/      MySQL 8.0 schema definitions (30 tables)
│   ├── routes/                   api.php (/api/health, /businesses, /reviews, etc.)
│   └── tests/Feature/            Automated PHPUnit & Pest test suite
│
└── 🚀 .github/
    └── workflows/
        ├── deploy.yml            Automated GitHub Actions CI/CD to VPS
        ├── scanner-deploy.yml    ClamAV malware scanner maintenance pipeline
        └── cert-renewal.yml      Let's Encrypt TLS certificate renewal
```

---

## ✨ Key Features

1. **Robust Authentication & Security**:
   - **Google 1-Click OAuth**: Seamless sign-in with automatic email verification.
   - **Strict Token Expiration**: Email verification links and password reset tokens automatically expire after 5 minutes.
   - **Bcrypt Password Hashing**: Passwords securely hashed and salted in MySQL.
   - **Sanctum HTTP-Only Sessions**: Protected state preventing token theft or XSS leakage.
   - **Antivirus / Malware Scanning**: ClamAV scans all uploaded attachments (PDFs, images) before storage.

2. **Entity Discovery & Multi-Dimension Filtering**:
   - **4,860+ OpenStreetMap Directory Listings**: Fully attributed canonical organizations across Bangladesh.
   - **Real-Time Bilingual Search**: Instant search matching across English & Bengali names (`স্কয়ার হাসপাতাল`, `স্টার টেক`), categories, locations, and descriptions.
   - **Category Filters**: Products, Businesses & Services, Doctors & Professionals, Hospitals & Clinics, Universities & Education, Courier & Digital Services.
   - **Rating Distribution & Star Filter**: Filter entity reviews by star ratings or sort by newest, highest rating, and most helpful.

3. **Structured Review Submission & Claims**:
   - Interactive gold star rating component with dimensional feedback.
   - Image & receipt photo upload zone with malware scanning.
   - Organization claim workflow with evidence verification for business owners.

4. **Forensic Scam Alerts & Public Case Records**:
   - Dedicated Scam Alerts status view with public updates and evidence tracking.
   - Clear distinction between consumer reviews and forensic incident reports.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v22+ (matches GitHub Actions CI runner)
- **PHP**: v8.2+ (PHP 8.4 recommended to match production)
- **Composer**: v2+
- **MySQL**: v8.0+

### 1. Backend Setup (Laravel 12 API)

```bash
cd backend
cp .env.example .env

# Configure your DB_DATABASE, DB_USERNAME, DB_PASSWORD in .env

# Install dependencies & generate app key
composer install
php artisan key:generate

# Run migrations and link storage
php artisan migrate
php artisan storage:link

# Start Laravel server (Port 8001)
php artisan serve --port=8001
```

Run automated backend feature tests:
```bash
php artisan test
```

### 2. Frontend Setup (React 19 / Vite)

```bash
cd frontend

# Install dependencies
npm ci

# Start Vite development server
npm run dev

# Run TypeScript compilation check
npm run test
```

To build production static assets:
```bash
npm run build
```
*(Compiled output is generated in `backend/public/app/`)*

---

## 🌐 Production & VPS Deployment Architecture

The application is deployed on Ubuntu 24.04 LTS under dedicated student account `s20230204112`:
- **Web Server**: Nginx (Reverse Proxy & Static Asset Server)
- **PHP Engine**: PHP 8.4 FPM via dedicated Unix socket (`/run/php/php8.4-fpm-s20230204112.sock`)
- **Database**: MySQL 8.0 on `127.0.0.1:3307` (`truthhub_db` with non-root user `truthhub`)
- **TLS/SSL**: Let's Encrypt automated certificate with HTTP (308) to HTTPS redirection
- **CI/CD Pipeline**: Automated GitHub Actions (`.github/workflows/deploy.yml`):
  1. Installs PHP 8.4 & Composer dependencies
  2. Builds static React application with Vite
  3. Packages release archive and verifies forbidden paths are absent
  4. Deploys via SCP and triggers zero-downtime deployment script on VPS
  5. Runs migrations, optimizes caches, and verifies `/up` and `/api/health`

---

## 🔒 Security & Compliance
TruthHubBD adheres to industry security best practices:
- HTTP requests are permanently redirected to HTTPS.
- Session cookies use `Secure`, `HttpOnly`, and `SameSite=Lax` flags.
- Private evidence files are protected by middleware authorization and ClamAV scanning.
- `.env` and sensitive configurations are secured with `chmod 600`.
