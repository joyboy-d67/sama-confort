<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

## ✅ Project Setup Complete

### Project: VTC Driver Booking Platform

**Status:** Fully functional and ready for development

**Stack:**
- Next.js 15 with App Router and TypeScript
- Tailwind CSS with dark theme (Uber-inspired)
- Prisma ORM with PostgreSQL
- Google Maps API integration
- Nodemailer for email notifications
- React Hook Form + Zod validation

### 🚀 Quick Start

1. **Configuration de l'environnement**
   - Copier `.env.example` vers `.env`
   - Configurer la base de données PostgreSQL
   - Ajouter la clé API Google Maps
   - Configurer les credentials SMTP

2. **Installation**
   ```bash
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Accès**
   - Site: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Réservation: http://localhost:3000/reserver

### 📁 Structure

- `/app` - Pages et routes API Next.js
- `/components` - Composants réutilisables (UI + booking)
- `/lib` - Utilitaires (Prisma, email, calculs)
- `/prisma` - Schéma de base de données
- `/types` - Types TypeScript

### 🎨 Design System

Thème sombre avec:
- Couleur primaire: `#0d6efd` (bleu)
- Fond: noir `#000000`
- Éléments: gris anthracite `#2a2a2a`
- Composants: Button, Input, Card, Textarea

### ✨ Fonctionnalités Implémentées

✅ Système de réservation complet avec validation
✅ Auto-complétion adresses (Google Places API)
✅ Carte interactive avec trajet animé
✅ Calcul automatique de distance et prix
✅ Gestion des créneaux horaires (6h-23h)
✅ Réservations récurrentes (quotidien/hebdo/mensuel)
✅ Interface administrateur (liste, validation/refus)
✅ Notifications email automatiques
✅ Pages: Accueil, Réservation, Tarifs, FAQ, Mentions légales
✅ Design responsive et accessible

### 🔧 Configuration Requise

- Node.js 18+
- PostgreSQL 14+
- Clé API Google Maps (Places + Distance Matrix)
- Compte SMTP (Gmail recommandé)
