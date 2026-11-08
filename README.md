# VTC Booking Platform 🚗

Plateforme moderne de réservation de chauffeur VTC avec interface sombre inspirée d'Uber.

## 🌟 Fonctionnalités

### Système de Réservation
- ✅ Formulaire complet avec validation (nom, prénom, téléphone, email)
- ✅ Auto-complétion des adresses avec Google Places API
- ✅ Sélection de date et créneaux horaires (6h-23h)
- ✅ Réservations jusqu'à 3 mois à l'avance
- ✅ Réservations récurrentes (quotidien, hebdomadaire, mensuel)
- ✅ Gestion des créneaux disponibles/indisponibles

### Tarification
- 💰 **Moins de 10km** : Forfait 13€
- 💰 **Plus de 10km** : 1,35€/km
- 📊 Calcul automatique de la distance avec Google Distance Matrix
- 🗺️ Affichage du trajet sur carte interactive

### Notifications
- 📧 Email automatique à l'administrateur à chaque réservation
- 📋 Récapitulatif complet (client, trajet, prix, date/heure)

### Interface Utilisateur
- 🌑 Thème sombre (noir, gris anthracite, accent bleu #0d6efd)
- 📱 Design responsive (mobile-first)
- ♿ Accessible (WCAG 2.1 AA)
- ⚡ Animations fluides et performance optimisée

## 🛠️ Technologies

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : PostgreSQL + Prisma ORM
- **Maps** : Google Maps API
- **Email** : Nodemailer
- **Validation** : Zod + React Hook Form
- **UI Components** : Lucide Icons, React Hot Toast

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+
- Clé API Google Maps (avec Places API et Distance Matrix API activées)
- Compte SMTP pour l'envoi d'emails

### Étapes d'installation

1. **Cloner le projet**

```bash
cd "/Users/joyboy/Documents/App Papa"
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vtc_booking?schema=public"

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
ADMIN_EMAIL="admin@vtc-booking.com"

# NextAuth (optionnel pour l'admin)
NEXTAUTH_SECRET="your_secret_key_here"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurer la base de données**

```bash
# Créer la base de données PostgreSQL
createdb vtc_booking

# Exécuter les migrations Prisma
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

5. **Lancer le serveur de développement**

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🗂️ Structure du Projet

```
app/
├── api/
│   ├── bookings/      # API réservations
│   └── timeslots/     # API créneaux horaires
├── reserver/          # Page de réservation
├── tarifs/            # Page tarifs
├── faq/               # Page FAQ
├── layout.tsx         # Layout principal
└── page.tsx           # Page d'accueil

components/
├── booking/
│   ├── AddressAutocomplete.tsx  # Auto-complétion adresses
│   ├── MapComponent.tsx         # Carte Google Maps
│   └── TimeSlotPicker.tsx       # Sélection créneaux
└── ui/
    ├── Button.tsx     # Composant bouton
    ├── Input.tsx      # Composant input
    ├── Card.tsx       # Composant carte
    └── Textarea.tsx   # Composant textarea

lib/
├── prisma.ts          # Client Prisma
├── email.ts           # Envoi d'emails
└── utils.ts           # Fonctions utilitaires

prisma/
└── schema.prisma      # Schéma de base de données

types/
└── index.ts           # Types TypeScript
```

## 🔑 Configuration Google Maps API

1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activez les APIs suivantes :
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
   - Geocoding API
3. Créez une clé API et ajoutez-la dans `.env`

## 📧 Configuration Email (Gmail)

1. Activez la validation en 2 étapes sur votre compte Gmail
2. Créez un mot de passe d'application :
   - Compte Google → Sécurité → Validation en 2 étapes → Mots de passe d'application
3. Utilisez ce mot de passe dans `SMTP_PASSWORD`

## 🗄️ Base de Données

### Modèles Principaux

- **Booking** : Réservations des clients
- **TimeSlot** : Créneaux horaires disponibles
- **AdditionalService** : Services supplémentaires
- **Service** : Services disponibles
- **Settings** : Configuration du site

### Commandes Prisma Utiles

```bash
# Créer une migration
npx prisma migrate dev --name description

# Voir la base de données
npx prisma studio

# Réinitialiser la base
npx prisma migrate reset
```

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Variables d'environnement sur Vercel

Ajoutez toutes les variables du fichier `.env` dans les paramètres du projet Vercel.

## 📱 Pages Disponibles

- `/` - Page d'accueil
- `/reserver` - Formulaire de réservation
- `/tarifs` - Page des tarifs
- `/faq` - Questions fréquentes
- `/mentions-legales` - Mentions légales (à créer)
- `/cgu` - Conditions générales (à créer)
- `/confidentialite` - Politique de confidentialité (à créer)

## 🔮 Fonctionnalités Futures

- [ ] Interface administrateur complète
- [ ] Authentification utilisateurs
- [ ] Historique des réservations
- [ ] Paiement en ligne (Stripe)
- [ ] Notifications SMS (Twilio)
- [ ] Programme de fidélité
- [ ] Export des réservations (CSV, PDF)
- [ ] Multi-langue (i18n)

## 🐛 Dépannage

### La carte ne s'affiche pas
- Vérifiez que la clé API Google Maps est correcte
- Vérifiez que les APIs nécessaires sont activées
- Vérifiez la console du navigateur pour les erreurs

### Les emails ne sont pas envoyés
- Vérifiez les credentials SMTP
- Vérifiez que le port 587 n'est pas bloqué
- Pour Gmail, utilisez un mot de passe d'application

### Erreurs de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez la chaîne de connexion DATABASE_URL
- Exécutez `npx prisma generate`

## 📄 Licence

Ce projet est privé et propriétaire.

## 👥 Support

Pour toute question ou problème :
- Email : afatahallah84@gmail.com
- Téléphone : +33 6 49 09 56 66

---

**VTC Booking** - Service de réservation de chauffeur privé
