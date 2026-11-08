# Guide de Démarrage Rapide - VTC Booking 🚗

## Configuration Initiale (5 minutes)

### 1. Variables d'environnement

Renommez `.env.example` en `.env` et configurez :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/vtc_booking"

# Google Maps API (IMPORTANT: Activez Places API et Distance Matrix API)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="votre_cle_ici"

# Email (Gmail recommandé)
SMTP_USER="votre.email@gmail.com"
SMTP_PASSWORD="mot_de_passe_application"
ADMIN_EMAIL="admin@vtc-booking.com"
```

### 2. Base de données PostgreSQL

```bash
# Créer la base de données
createdb vtc_booking

# OU avec psql
psql -U postgres
CREATE DATABASE vtc_booking;
\q
```

### 3. Installation et démarrage

```bash
# Installer les dépendances
npm install

# Créer les tables de la base de données
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Démarrer le serveur de développement
npm run dev
```

✅ Le site sera accessible sur **http://localhost:3000**

## 🗺️ Configuration Google Maps API

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet ou sélectionner un existant
3. Activer ces APIs dans "APIs & Services" > "Library" :
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Distance Matrix API
   - ✅ Geocoding API
4. Créer une clé API dans "Credentials"
5. Copier la clé dans `.env` → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 📧 Configuration Email (Gmail)

1. Activer la **validation en 2 étapes** sur votre compte Gmail
2. Générer un **mot de passe d'application** :
   - Compte Google → Sécurité → Validation en 2 étapes
   - Mots de passe d'application → Sélectionner "Autre"
   - Copier le mot de passe généré
3. Dans `.env` :
   - `SMTP_USER` = votre email Gmail
   - `SMTP_PASSWORD` = le mot de passe d'application

## 🎯 Pages Disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Page d'accueil avec présentation |
| Réservation | `/reserver` | Formulaire de réservation complet |
| Tarifs | `/tarifs` | Grille tarifaire |
| FAQ | `/faq` | Questions fréquentes |
| Admin | `/admin` | Dashboard administrateur |
| Mentions légales | `/mentions-legales` | Mentions légales du site |

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm start

# Base de données
npx prisma studio          # Interface graphique BDD
npx prisma migrate dev     # Créer une migration
npx prisma migrate reset   # Réinitialiser la BDD

# Code
npm run lint               # Vérifier le code
```

## 📊 Prisma Studio

Pour visualiser et gérer votre base de données graphiquement :

```bash
npx prisma studio
```

Ouvre une interface web sur http://localhost:5555

## 🎨 Personnalisation

### Couleurs (Tailwind)

Modifiez `tailwind.config.ts` :

```typescript
colors: {
  primary: '#0d6efd',  // Couleur principale
  dark: '#000000',     // Fond
  // ...
}
```

### Tarification

Modifiez `lib/utils.ts` → fonction `calculatePrice()` :

```typescript
if (distance < 10) {
  basePrice = 13;  // Prix forfait < 10km
} else {
  basePrice = distance * 1.35;  // Prix par km
}
```

## 🐛 Résolution de Problèmes

### La carte Google Maps ne s'affiche pas
- ✅ Vérifier que la clé API est dans `.env`
- ✅ Vérifier que les APIs sont activées sur Google Cloud
- ✅ Ouvrir la console du navigateur pour voir les erreurs

### Les emails ne sont pas envoyés
- ✅ Vérifier les credentials SMTP dans `.env`
- ✅ Utiliser un mot de passe d'application (pas votre mot de passe Gmail)
- ✅ Vérifier que le port 587 n'est pas bloqué

### Erreur de connexion à la base de données
- ✅ Vérifier que PostgreSQL est démarré
- ✅ Vérifier la chaîne DATABASE_URL dans `.env`
- ✅ Exécuter `npx prisma generate`

### Build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules .next
npm install
npm run build
```

## 📱 Test en Local

1. **Réserver un trajet** : http://localhost:3000/reserver
   - Entrez des adresses françaises
   - Sélectionnez une date et un créneau
   - Remplissez le formulaire

2. **Voir l'admin** : http://localhost:3000/admin
   - Liste des réservations
   - Valider/Refuser les demandes

3. **Vérifier les emails**
   - Un email est envoyé à `ADMIN_EMAIL` à chaque réservation

## 🚀 Déploiement (Vercel)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configuration
# - Ajouter toutes les variables d'environnement
# - DATABASE_URL doit pointer vers une BDD en production
```

## 📚 Documentation Complète

Voir [README.md](./README.md) pour la documentation complète.

## 🆘 Support

- Email : afatahallah84@gmail.com
- Tel : +33 6 49 09 56 66

---

**Bon développement ! 🎉**
