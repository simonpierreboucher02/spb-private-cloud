# SPB Private Cloud - Todo & Upgrades

## Priorité Haute

- [x] **Rate limiting login** - Protection brute-force sur `/api/auth/login`
- [ ] **Migration PostgreSQL** - Remplacer SQLite par PostgreSQL pour la production
- [ ] **HTTPS / SSL** - Configurer certificats SSL (Let's Encrypt)
- [ ] **CSRF protection** - Implémenter tokens CSRF sur les formulaires
- [ ] **Validation types fichiers** - Bloquer les fichiers dangereux (.exe, .bat, scripts)
- [ ] **Chunk upload** - Upload par morceaux pour fichiers volumineux (>100MB)
- [ ] **Corbeille (Recycle Bin)** - Soft delete avec récupération sous 30 jours
- [x] **Changement mot de passe** - Interface admin pour modifier le password

## Priorité Moyenne

- [x] **2FA (Two-Factor Auth)** - Authentification TOTP (Google Authenticator)
- [ ] **Drag & drop fichiers vers dossiers** - Glisser fichiers entre dossiers
- [x] **Bulk actions** - Sélection multiple + actions groupées (supprimer, déplacer, ZIP, chiffrer)
- [x] **Download dossier en ZIP** - Télécharger un dossier complet en archive
- [ ] **Image thumbnails** - Générer des miniatures pour les images
- [ ] **Video streaming** - Streaming adaptatif pour les vidéos (HLS)
- [ ] **Progress bar réelle** - Upload avec progression réelle via XMLHttpRequest
- [ ] **Infinite scroll** - Pagination infinie
- [ ] **Lazy loading images** - Chargement progressif des images
- [x] **Backup automatique** - Backup DB + fichiers en ZIP
- [x] **Notifications** - Système de notifications avec badge

## Fonctionnalités Avancées

- [x] **Multi-user system** - Plusieurs utilisateurs avec comptes séparés
- [x] **Permission management** - Rôles (admin, user, viewer)
- [ ] **Versioning complet** - Historique de toutes les versions avec diff visuel
- [x] **OCR PDF** - Extraction texte des PDF/images via Claude Vision
- [x] **AI Search** - Recherche sémantique via Claude Sonnet 4.5
- [x] **Auto-tagging** - Classification automatique des fichiers via IA
- [ ] **Album photo intelligent** - Regroupement par date/lieu
- [x] **Encrypted storage** - Chiffrement at-rest AES-256-GCM
- [ ] **Sync multi-device** - Synchronisation avec d'autres appareils
- [ ] **Accès Tailscale** - VPN mesh pour accès sécurisé
- [ ] **WebDAV support** - Monter le cloud comme lecteur réseau
- [x] **API publique** - REST API avec clés API `/api/v1/files`

## UI/UX Améliorations

- [x] **Mode clair/sombre** - Toggle light/dark theme
- [x] **Assistant IA** - Panel latéral avec recherche IA et chat
- [x] **Cloche notifications** - Badge avec compteur non-lus
- [x] **Gestion utilisateurs** - Interface admin CRUD
- [x] **Gestion clés API** - Interface de création/suppression
- [x] **Configuration 2FA** - Setup QR code + vérification
- [x] **Panel backup** - Interface de gestion des backups
- [ ] **Thèmes personnalisés** - Couleurs accent personnalisables
- [ ] **Raccourcis clavier** - Ctrl+U upload, Ctrl+N nouveau dossier
- [ ] **Drag & drop global** - Déposer fichiers n'importe où
- [ ] **Preview plein écran mobile** - Swipe navigation entre images
- [ ] **Grid size ajustable** - Slider pour taille des vignettes
- [ ] **Tri avancé** - Tri par nom, date, taille, type
- [ ] **Filtres avancés** - Filtrer par type, date, taille, tags

## Performance

- [ ] **CDN local** - Cache statique pour fichiers fréquemment accédés
- [ ] **Service Worker** - Cache offline pour l'interface
- [ ] **Image optimization** - Compression automatique des images
- [ ] **Database indexing** - Optimiser les index
- [ ] **Connection pooling** - Pool de connexions DB

## DevOps

- [ ] **Docker compose** - Containeriser l'app
- [ ] **CI/CD pipeline** - GitHub Actions
- [ ] **Monitoring** - Health checks, métriques
- [ ] **Logs structurés** - Logging JSON avec rotation
- [ ] **Auto-update** - Mécanisme de mise à jour
