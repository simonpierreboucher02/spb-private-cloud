Parfait.
Là on parle d’un cloud personnel privé, sérieux, propre, local-first, sécurisé, mobile adaptable — pas un Dropbox cheap.

Je te fais un CLAUDE.md complet, architecture claire, orienté production, avec accès admin123 (mais sécurisé correctement).

⸻

📘 CLAUDE.md

Projet : SPB Private Cloud

Owner: Simon-Pierre Boucher

⸻

🎯 OBJECTIF

Construire un cloud personnel privé, accessible via navigateur, avec :
	•	Upload de tout type de fichier
	•	Organisation en dossiers
	•	Partage via liens sécurisés
	•	Interface moderne
	•	100% smartphone adaptable
	•	Dashboard admin protégé par mot de passe admin123
	•	Hébergé localement (Mac Studio / NAS / VPS)
	•	Aucune dépendance à Google / Dropbox

⸻

📱 EXIGENCE MOBILE (OBLIGATOIRE)

Le cloud doit être :
	•	Parfaitement utilisable sur iPhone
	•	Mobile-first design
	•	Drag & drop desktop
	•	Upload natif mobile
	•	Preview plein écran mobile
	•	Boutons large touch-friendly
	•	Sidebar collapsible mobile

⸻

🧱 STACK TECHNIQUE

Frontend :
	•	Next.js 14
	•	TypeScript
	•	Tailwind CSS
	•	Framer Motion

Backend :
	•	Node.js
	•	PostgreSQL
	•	Prisma ORM
	•	File storage local (ou S3 compatible)

Auth :
	•	Password login admin123
	•	Hash bcrypt
	•	Session cookie HTTP-only

⸻

🌐 ARCHITECTURE

/app
  /login
  /dashboard
  /files
  /folders
  /shared
  /admin
/lib
/storage
/uploads
/prisma
/components


⸻

🔐 AUTHENTIFICATION

Page /login
	•	Input password
	•	Si password valide → créer session
	•	Middleware protège toutes routes sauf login

⚠️ Même si pw simple :
	•	Hash bcrypt en DB
	•	Rate limit login
	•	Session expiration
	•	Logout automatique

⸻

📦 FONCTIONNALITÉS CLOUD

1️⃣ Gestion de fichiers
	•	Upload multi-fichiers
	•	Drag & drop
	•	Upload mobile caméra
	•	Rename
	•	Delete
	•	Move file
	•	Duplicate
	•	File size limit configurable
	•	Progress bar upload

⸻

2️⃣ Gestion de dossiers
	•	Créer dossier
	•	Dossier imbriqué
	•	Breadcrumb navigation
	•	Drag file vers dossier
	•	Rename folder
	•	Delete folder

⸻

3️⃣ Preview de fichiers

Support :
	•	PDF
	•	Images
	•	Vidéo
	•	Audio
	•	Markdown
	•	Code (syntax highlight)
	•	TXT
	•	CSV preview

Mobile :
	•	Preview full-screen
	•	Swipe navigation images

⸻

4️⃣ Partage sécurisé

Créer lien :
	•	Expiration date
	•	Password optionnel
	•	Download only
	•	Preview only
	•	Désactiver à tout moment

⸻

5️⃣ Dashboard admin

Accessible via /admin
	•	Storage utilisé
	•	Nombre fichiers
	•	Activité récente
	•	Logs accès
	•	Gestion liens partagés

Mobile :
	•	Cartes verticales
	•	No horizontal scroll

⸻

6️⃣ Recherche
	•	Search full-text filename
	•	Search par type
	•	Search par date
	•	Search par taille

⸻

7️⃣ Sécurité
	•	Hash password
	•	CSRF protection
	•	Rate limiting
	•	XSS protection
	•	File type validation
	•	Antivirus hook (optionnel)
	•	HTTPS only

⸻

🗄️ DATABASE STRUCTURE

Users

| id | passwordHash | createdAt |

⸻

Files

| id | name | path | size | mimeType | folderId | createdAt |

⸻

Folders

| id | name | parentId | createdAt |

⸻

SharedLinks

| id | fileId | token | expiresAt | passwordHash | active |

⸻

ActivityLogs

| id | action | fileId | timestamp |

⸻

📱 UI STRUCTURE

Desktop
	•	Sidebar gauche
	•	File explorer centre
	•	Preview panel droite

Mobile
	•	Sidebar hidden
	•	Hamburger menu
	•	Full width file explorer
	•	Preview modal full screen

⸻

🚀 FONCTIONNALITÉS AVANCÉES (OPTIONNEL)
	•	Album photo intelligent (face recognition local)
	•	Tagging automatique
	•	OCR PDF
	•	AI search (“Find all files about FOMC”)
	•	Versioning fichiers
	•	Recycle bin
	•	Backup automatique
	•	Sync multi-Mac
	•	Accès via Tailscale sécurisé
	•	Encrypted storage at rest

⸻

🧠 POSITIONNEMENT

Ce cloud doit être :
	•	Privé
	•	Souverain
	•	Minimaliste
	•	Plus clean que Dropbox
	•	Plus sécurisé que Google Drive
	•	Mobile-ready
	•	Local-first

⸻

⚙️ PERFORMANCE
	•	Chunk upload
	•	Lazy loading
	•	Infinite scroll
	•	Optimized image loading
	•	Streaming preview

⸻

🔮 ÉVOLUTION FUTURE
	•	Multi-user system
	•	Permission management
	•	AI assistant intégré
	•	Auto organization fichiers
	•	Vector database index
	•	Search sémantique

⸻

🎨 DESIGN
	•	Dark mode par défaut
	•	Noir / gris / blanc
	•	Typo Inter
	•	UI minimal
	•	Micro-animations subtiles

⸻

🛡️ NOTE IMPORTANTE

Même si accès = admin123,
le système doit être codé proprement pour pouvoir :
	•	Changer mot de passe
	•	Ajouter 2FA futur
	•	Ajouter multi-user

⸻

Si tu veux maintenant :
	1.	🔥 Je te génère l’architecture complète du projet
	2.	💻 Je te code le système login
	3.	📁 Je te code le file explorer
	4.	📱 Je te fais le layout mobile-first complet
	5.	🧠 On ajoute AI local pour ton cloud.spboucher

Tu veux le faire :
	•	Local sur Mac Studio ?
	•	Sur NAS ?
	•	Sur VPS public sécurisé ?
