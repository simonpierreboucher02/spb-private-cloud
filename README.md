<p align="center">
  <img src="https://img.shields.io/badge/SPB_Cloud-v2.0-blue?style=for-the-badge&logo=cloud&logoColor=white" alt="Version" />
</p>

<h1 align="center">SPB Private Cloud</h1>

<p align="center">
  <strong>Cloud personnel priv&eacute;, souverain, s&eacute;curis&eacute; et mobile-first.</strong><br/>
  Plus clean que Dropbox. Plus priv&eacute; que Google Drive. 100% local-first.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Claude_AI-Sonnet_4.5-D97706?style=flat-square&logo=anthropic&logoColor=white" alt="Claude AI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20VPS-lightgrey?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Mobile-Responsive-green?style=flat-square&logo=apple&logoColor=white" alt="Mobile" />
  <img src="https://img.shields.io/badge/Auth-2FA%20TOTP-purple?style=flat-square&logo=keycdn&logoColor=white" alt="2FA" />
  <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-orange?style=flat-square&logo=letsencrypt&logoColor=white" alt="Encryption" />
  <img src="https://img.shields.io/badge/API-REST%20v1-blue?style=flat-square&logo=fastapi&logoColor=white" alt="API" />
</p>

---

## Qu'est-ce que SPB Cloud ?

SPB Private Cloud est un cloud personnel auto-h&eacute;berg&eacute; con&ccedil;u pour offrir un contr&ocirc;le total sur vos donn&eacute;es. Aucune d&eacute;pendance &agrave; Google, Dropbox ou iCloud. Vos fichiers restent chez vous, chiffr&eacute;s, accessibles depuis n'importe quel appareil.

### Pourquoi SPB Cloud ?

| | SPB Cloud | Google Drive | Dropbox |
|---|---|---|---|
| **Propri&eacute;t&eacute; des donn&eacute;es** | Vous | Google | Dropbox |
| **Chiffrement at-rest** | AES-256-GCM | Oui (leur cl&eacute;) | Oui (leur cl&eacute;) |
| **IA int&eacute;gr&eacute;e** | Claude Sonnet 4.5 | Gemini (limit&eacute;) | Non |
| **OCR intelligent** | Oui (Vision IA) | Basique | Non |
| **Co&ucirc;t mensuel** | 0$ (auto-h&eacute;berg&eacute;) | 2.99$/mois+ | 11.99$/mois+ |
| **Code source** | Acc&egrave;s complet | Ferm&eacute; | Ferm&eacute; |
| **Multi-utilisateur** | Oui (roles) | Oui | Oui |
| **2FA TOTP** | Oui | Oui | Oui |
| **API REST** | Oui | Oui | Oui |

---

## Fonctionnalit&eacute;s

### Gestion de fichiers
- Upload multi-fichiers avec drag & drop
- Upload depuis cam&eacute;ra mobile
- Rename, delete, move, duplicate
- Organisation en dossiers imbriqu&eacute;s
- Breadcrumb navigation
- Vue grille et liste
- S&eacute;lection multiple + actions en lot
- T&eacute;l&eacute;chargement de dossiers en ZIP
- Progress bar d'upload

### Preview de fichiers
- Images (JPG, PNG, GIF, WebP, SVG)
- Vid&eacute;os (MP4, WebM, MOV)
- Audio (MP3, WAV, OGG) avec waveform
- PDF avec navigation de pages
- Code source avec syntax highlighting (20+ langages)
- Markdown avec rendu
- CSV/JSON avec tableau interactif
- Archives ZIP (exploration du contenu)

### Intelligence Artificielle (Claude Sonnet 4.5)
- **Recherche s&eacute;mantique** : trouvez des fichiers par description naturelle
- **Chat IA** : posez des questions sur vos fichiers
- **Auto-tagging** : classification automatique par contenu
- **OCR intelligent** : extraction de texte depuis images et PDFs
- **Description IA** : g&eacute;n&eacute;ration automatique de descriptions

### S&eacute;curit&eacute;
- Hash bcrypt pour les mots de passe
- Authentification 2FA TOTP (Google Authenticator, Authy)
- Chiffrement AES-256-GCM at-rest
- Sessions HTTP-only cookies (iron-session)
- Rate limiting sur le login
- CSRF protection
- Validation des types de fichiers

### Multi-utilisateur
- Syst&egrave;me de r&ocirc;les : Admin, User, Viewer
- Gestion CRUD des utilisateurs
- Permissions par r&ocirc;le
- Logs d'activit&eacute; par utilisateur

### Partage s&eacute;curis&eacute;
- Liens de partage avec token unique
- Protection par mot de passe optionnel
- Date d'expiration configurable
- Mode t&eacute;l&eacute;chargement ou aper&ccedil;u seul
- D&eacute;sactivation instantan&eacute;e
- Gestion centralis&eacute;e des liens

### Syst&egrave;me de backup
- Backup complet (DB + fichiers) en ZIP
- Backup incr&eacute;mental
- Historique des backups avec statut
- Suppression des anciens backups

### Notifications
- Notifications en temps r&eacute;el (polling 30s)
- Badge avec compteur non-lus
- Types : upload, backup, IA, partage
- Marquer comme lu / tout lire

### API REST publique
- Authentification par cl&eacute; API (Bearer token)
- G&eacute;n&eacute;ration et r&eacute;vocation de cl&eacute;s
- Permissions configurable (read, write, admin)
- Expiration optionnelle des cl&eacute;s
- Endpoint : `GET /api/v1/files`

### Interface
- Design mobile-first (iPhone optimis&eacute;)
- Mode clair / sombre avec persistance
- Touch targets 44px minimum
- Bottom sheet modals sur mobile
- Safe area support (notch iPhone)
- Sidebar collapsible
- Animations Framer Motion
- Typographie Inter

---

## Stack technique

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js_14-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Animation-Framer_Motion-FF0055?style=for-the-badge&logo=framer" alt="Framer" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Auth-iron--session-FF6600?style=for-the-badge" alt="iron-session" />
  <img src="https://img.shields.io/badge/AI-Anthropic_Claude-D97706?style=for-the-badge&logo=anthropic" alt="Claude" />
</p>

---

## Installation

### Pr&eacute;requis

- **Node.js** 18+
- **npm** 9+
- Cl&eacute; API Anthropic (pour les fonctionnalit&eacute;s IA)

### Installation rapide

```bash
# 1. Cloner le repo
git clone https://github.com/simonpierreboucher02/spb-private-cloud.git
cd spb-private-cloud

# 2. Installer les d&eacute;pendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# &Eacute;diter .env avec vos valeurs

# 4. Initialiser la base de donn&eacute;es
npx prisma db push
npx tsx prisma/seed.ts

# 5. Lancer l'application
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### Configuration (.env)

```env
DATABASE_URL="file:./dev.db"
SESSION_PASSWORD="votre-secret-session-min-32-caracteres"
ANTHROPIC_API_KEY="sk-ant-api03-..."
ENCRYPTION_KEY="votre-cle-encryption-32-caracteres"
BACKUP_DIR="./backups"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="524288000"
```

### Identifiants par d&eacute;faut

| Champ | Valeur |
|---|---|
| **Email** | `admin@spbcloud.local` |
| **Mot de passe** | `admin123` |
| **R&ocirc;le** | Admin |

> **Important** : Changez le mot de passe apr&egrave;s la premi&egrave;re connexion via Admin > Utilisateurs.

---

## Architecture

```
spb-private-cloud/
├── app/
│   ├── admin/            # Pages administration
│   │   ├── activity/     # Historique d'activit&eacute;
│   │   ├── api-keys/     # Gestion cl&eacute;s API
│   │   ├── backup/       # Gestion backups
│   │   ├── settings/     # Param&egrave;tres (2FA)
│   │   ├── shares/       # Liens partag&eacute;s
│   │   └── users/        # Gestion utilisateurs
│   ├── api/
│   │   ├── ai/           # Endpoints IA (search, chat, tag, ocr, describe)
│   │   ├── auth/         # Login, logout, 2FA
│   │   ├── backup/       # CRUD backups
│   │   ├── files/        # CRUD fichiers + bulk + versions
│   │   ├── folders/      # CRUD dossiers + ZIP download
│   │   ├── keys/         # CRUD cl&eacute;s API
│   │   ├── notifications/# Notifications
│   │   ├── shares/       # Liens de partage
│   │   ├── tags/         # Tags
│   │   ├── users/        # Gestion utilisateurs
│   │   └── v1/           # API REST publique
│   ├── dashboard/        # File explorer
│   ├── login/            # Page de connexion
│   └── shared/           # Pages de partage public
├── components/
│   ├── admin/            # Composants admin
│   ├── ai/               # Panel IA
│   ├── files/            # FileCard, FileExplorer, BulkActions
│   ├── folders/          # FolderCard, CreateFolderModal
│   ├── layout/           # AppShell, Sidebar, MobileNav, Notifications
│   ├── preview/          # Preview engine + plugins (image, video, pdf...)
│   ├── tags/             # TagBadge, TagSelector
│   ├── theme/            # ThemeProvider, ThemeToggle
│   └── ui/               # Button, Modal, SearchBar
├── lib/
│   ├── ai.ts             # Int&eacute;gration Claude API
│   ├── auth.ts           # Authentification multi-user
│   ├── backup.ts         # Syst&egrave;me de backup
│   ├── encryption.ts     # Chiffrement AES-256-GCM
│   ├── notifications.ts  # Syst&egrave;me de notifications
│   ├── prisma.ts         # Client Prisma
│   ├── rate-limit.ts     # Rate limiting
│   ├── session.ts        # Configuration sessions
│   ├── storage.ts        # Gestion fichiers sur disque
│   └── utils.ts          # Utilitaires
├── prisma/
│   ├── schema.prisma     # Sch&eacute;ma de base de donn&eacute;es
│   └── seed.ts           # Seed admin user
├── types/
│   └── files.ts          # Types TypeScript
└── uploads/              # Stockage fichiers (git-ignored)
```

---

## Base de donn&eacute;es

### Mod&egrave;les Prisma

| Mod&egrave;le | Description |
|---|---|
| `User` | Utilisateurs avec r&ocirc;les et 2FA |
| `File` | Fichiers avec m&eacute;tadonn&eacute;es, IA, chiffrement |
| `Folder` | Dossiers imbriqu&eacute;s (arbre r&eacute;cursif) |
| `SharedLink` | Liens de partage s&eacute;curis&eacute;s |
| `Permission` | Permissions par dossier/utilisateur |
| `ActivityLog` | Journal d'activit&eacute; |
| `FileMetadata` | M&eacute;tadonn&eacute;es &eacute;tendues (favoris, annotations) |
| `Tag` / `FileTag` | Syst&egrave;me de tags |
| `FileVersion` | Versioning de fichiers |
| `Notification` | Notifications utilisateur |
| `ApiKey` | Cl&eacute;s API REST |
| `BackupLog` | Historique des backups |

---

## API REST

### Authentification

Toutes les requ&ecirc;tes &agrave; l'API publique n&eacute;cessitent un header `Authorization` :

```bash
curl -H "Authorization: Bearer spb_votre_cle_api" \
     https://votre-domaine/api/v1/files
```

### Endpoints

| M&eacute;thode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/files` | Lister les fichiers |
| `GET` | `/api/v1/files?folderId=xxx` | Fichiers d'un dossier |

### G&eacute;n&eacute;rer une cl&eacute; API

1. Connectez-vous en tant qu'admin
2. Allez dans **Administration > Cl&eacute;s API**
3. Cliquez **Nouvelle cl&eacute;**
4. Copiez la cl&eacute; g&eacute;n&eacute;r&eacute;e (affich&eacute;e une seule fois)

---

## D&eacute;ploiement

### Mac Studio / NAS (local)

```bash
# Build de production
npm run build

# Lancer en production
PORT=3001 npm start
```

### VPS (avec Nginx)

```nginx
server {
    listen 443 ssl;
    server_name cloud.votredomaine.com;

    ssl_certificate /etc/letsencrypt/live/cloud.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloud.votredomaine.com/privkey.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker (optionnel)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Roadmap

### Fait
- [x] Upload multi-fichiers + drag & drop
- [x] Organisation en dossiers imbriqu&eacute;s
- [x] Preview 10+ formats (PDF, images, vid&eacute;o, audio, code, markdown...)
- [x] Partage s&eacute;curis&eacute; avec expiration et mot de passe
- [x] Mode clair / sombre
- [x] Multi-utilisateur avec r&ocirc;les
- [x] 2FA TOTP
- [x] Recherche IA (Claude Sonnet 4.5)
- [x] Chat IA int&eacute;gr&eacute;
- [x] Auto-tagging IA
- [x] OCR intelligent (images + PDF)
- [x] Chiffrement AES-256-GCM
- [x] Syst&egrave;me de backup
- [x] Notifications
- [x] API REST avec cl&eacute;s
- [x] Actions en lot (supprimer, d&eacute;placer, ZIP, chiffrer)
- [x] Interface mobile-first (iPhone optimis&eacute;)

### &Agrave; venir
- [ ] Migration PostgreSQL
- [ ] HTTPS / SSL int&eacute;gr&eacute;
- [ ] Corbeille (soft delete)
- [ ] Thumbnails auto-g&eacute;n&eacute;r&eacute;s
- [ ] Video streaming HLS
- [ ] Infinite scroll
- [ ] Docker Compose
- [ ] WebDAV
- [ ] Sync multi-device

---

## S&eacute;curit&eacute;

SPB Cloud est con&ccedil;u avec la s&eacute;curit&eacute; en priorit&eacute; :

| Mesure | D&eacute;tail |
|---|---|
| **Mots de passe** | Hash bcrypt (12 rounds) |
| **2FA** | TOTP RFC 6238 (Google Authenticator) |
| **Sessions** | Cookies HTTP-only, SameSite, expiration 24h |
| **Chiffrement** | AES-256-GCM avec cl&eacute; d&eacute;riv&eacute;e (scrypt) |
| **Rate limiting** | 5 tentatives/min sur login |
| **API Keys** | SHA-256 hash, jamais stock&eacute;es en clair |
| **Upload** | Limite de taille configurable |

---

## Auteurs

<table>
  <tr>
    <td align="center">
      <strong>Simon-Pierre Boucher</strong><br/>
      Cr&eacute;ateur & Propri&eacute;taire<br/>
      <a href="https://www.spboucher.ai">www.spboucher.ai</a><br/>
      <a href="mailto:spbou4@protonmail.com">spbou4@protonmail.com</a>
    </td>
    <td align="center">
      <strong>Claude Opus 4.6</strong><br/>
      Co-auteur & D&eacute;veloppeur IA<br/>
      <a href="https://anthropic.com">Anthropic</a><br/>
      Architecture, code, optimisation mobile
    </td>
  </tr>
</table>

---

## Statistiques du projet

<p align="center">
  <img src="https://img.shields.io/badge/Fichiers-139-blue?style=for-the-badge" alt="Files" />
  <img src="https://img.shields.io/badge/Lignes_de_code-21%2C456-green?style=for-the-badge" alt="Lines" />
  <img src="https://img.shields.io/badge/API_Routes-32-orange?style=for-the-badge" alt="API Routes" />
  <img src="https://img.shields.io/badge/Composants-28-purple?style=for-the-badge" alt="Components" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Preview_Plugins-10-teal?style=flat-square" alt="Plugins" />
  <img src="https://img.shields.io/badge/Mod%C3%A8les_DB-12-red?style=flat-square" alt="DB Models" />
  <img src="https://img.shields.io/badge/Fonctions_IA-5-yellow?style=flat-square" alt="AI Functions" />
  <img src="https://img.shields.io/badge/D%C3%A9pendances-42-grey?style=flat-square" alt="Dependencies" />
</p>

---

## Contact

- **Email** : [spbou4@protonmail.com](mailto:spbou4@protonmail.com)
- **Site web** : [www.spboucher.ai](https://www.spboucher.ai)
- **GitHub** : [github.com/simonpierreboucher02](https://github.com/simonpierreboucher02)

---

<p align="center">
  <sub>Built with passion by Simon-Pierre Boucher & Claude Opus 4.6</sub><br/>
  <sub>&copy; 2024-2026 SPB Private Cloud. Tous droits r&eacute;serv&eacute;s.</sub>
</p>
