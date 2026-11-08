# 🗄️ Guide Base de Données - Prisma

## Configuration Initiale

### 1. Installation PostgreSQL

#### macOS (avec Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Télécharger depuis [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Créer la Base de Données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE vtc_booking;

# Créer un utilisateur (optionnel)
CREATE USER vtc_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE vtc_booking TO vtc_user;

# Quitter
\q
```

### 3. Configurer .env

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/vtc_booking?schema=public"
# OU avec utilisateur custom
DATABASE_URL="postgresql://vtc_user:votre_mot_de_passe@localhost:5432/vtc_booking?schema=public"
```

## Commandes Prisma Essentielles

### Migrations

```bash
# Créer et appliquer la première migration
npx prisma migrate dev --name init

# Créer une nouvelle migration après modification du schema
npx prisma migrate dev --name add_user_table

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Voir l'état des migrations
npx prisma migrate status
```

### Client Prisma

```bash
# Générer le client Prisma après modification du schema
npx prisma generate

# Pousser le schema sans créer de migration (dev uniquement)
npx prisma db push
```

### Outils

```bash
# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Formater le schema
npx prisma format

# Valider le schema
npx prisma validate
```

## Schéma de la Base de Données

### Tables Existantes

```prisma
model Booking {
  id                String
  firstName         String
  lastName          String
  phoneNumber       String
  email             String?
  departureAddress  String
  destinationAddress String
  departureLat      Float
  departureLng      Float
  destinationLat    Float
  destinationLng    Float
  distance          Float
  date              DateTime
  timeSlot          String
  price             Float
  additionalServices AdditionalService[]
  isRecurring       Boolean
  recurrenceType    RecurrenceType?
  recurrenceEndDate DateTime?
  status            BookingStatus
  notes             String?
  createdAt         DateTime
  updatedAt         DateTime
}

model TimeSlot {
  id           String
  date         DateTime
  slot         String
  isAvailable  Boolean
  createdAt    DateTime
  updatedAt    DateTime
}

model AdditionalService {
  id          String
  name        String
  description String?
  price       Float
  bookingId   String
  booking     Booking
}

model Service {
  id          String
  name        String
  description String?
  price       Float
  isActive    Boolean
  createdAt   DateTime
  updatedAt   DateTime
}

model Settings {
  id        String
  key       String
  value     String
  updatedAt DateTime
}
```

## Exemples de Requêtes Prisma

### Dans votre code TypeScript

```typescript
import { prisma } from '@/lib/prisma';

// Créer une réservation
const booking = await prisma.booking.create({
  data: {
    firstName: "Jean",
    lastName: "Dupont",
    phoneNumber: "+33612345678",
    email: "jean@example.com",
    departureAddress: "Paris",
    destinationAddress: "Lyon",
    departureLat: 48.8566,
    departureLng: 2.3522,
    destinationLat: 45.7640,
    destinationLng: 4.8357,
    distance: 460,
    date: new Date("2025-12-25"),
    timeSlot: "10:00-11:00",
    price: 621.0,
    status: "PENDING",
  }
});

// Lire toutes les réservations
const bookings = await prisma.booking.findMany({
  include: {
    additionalServices: true,
  },
  orderBy: {
    date: 'desc',
  }
});

// Lire une réservation spécifique
const booking = await prisma.booking.findUnique({
  where: { id: "booking_id" },
  include: { additionalServices: true }
});

// Mettre à jour une réservation
const updated = await prisma.booking.update({
  where: { id: "booking_id" },
  data: { status: "CONFIRMED" }
});

// Supprimer une réservation
await prisma.booking.delete({
  where: { id: "booking_id" }
});

// Compter les réservations
const count = await prisma.booking.count({
  where: { status: "PENDING" }
});

// Filtrer par date
const todayBookings = await prisma.booking.findMany({
  where: {
    date: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
      lt: new Date(new Date().setHours(23, 59, 59, 999)),
    }
  }
});

// Créer un créneau horaire
await prisma.timeSlot.create({
  data: {
    date: new Date("2025-12-25"),
    slot: "10:00-11:00",
    isAvailable: true,
  }
});

// Marquer un créneau comme indisponible
await prisma.timeSlot.update({
  where: {
    date_slot: {
      date: new Date("2025-12-25"),
      slot: "10:00-11:00"
    }
  },
  data: { isAvailable: false }
});
```

## Requêtes SQL Directes (si nécessaire)

### Dans Prisma Studio ou psql

```sql
-- Voir toutes les réservations en attente
SELECT * FROM "Booking" WHERE status = 'PENDING';

-- Compter les réservations par statut
SELECT status, COUNT(*) as count 
FROM "Booking" 
GROUP BY status;

-- Réservations du jour
SELECT * FROM "Booking" 
WHERE DATE(date) = CURRENT_DATE;

-- Créneaux disponibles pour une date
SELECT * FROM "TimeSlot" 
WHERE date = '2025-12-25' AND "isAvailable" = true;

-- Chiffre d'affaires total
SELECT SUM(price) as total FROM "Booking" 
WHERE status = 'COMPLETED';

-- Réservations récurrentes
SELECT * FROM "Booking" 
WHERE "isRecurring" = true;
```

## Seed de la Base de Données

Créer `prisma/seed.ts` :

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Créer des services
  await prisma.service.createMany({
    data: [
      {
        name: "Siège bébé",
        description: "Siège auto adapté",
        price: 5.0,
        isActive: true,
      },
      {
        name: "Bouteille d'eau",
        description: "Eau minérale",
        price: 2.0,
        isActive: true,
      },
      {
        name: "Journal",
        description: "Presse quotidienne",
        price: 3.0,
        isActive: true,
      }
    ]
  });

  // Créer des créneaux pour les 7 prochains jours
  const slots = ["06:00-07:00", "07:00-08:00", "08:00-09:00", 
                 "09:00-10:00", "10:00-11:00", "11:00-12:00",
                 "12:00-13:00", "13:00-14:00", "14:00-15:00",
                 "15:00-16:00", "16:00-17:00", "17:00-18:00",
                 "18:00-19:00", "19:00-20:00", "20:00-21:00",
                 "21:00-22:00", "22:00-23:00"];

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);

    for (const slot of slots) {
      await prisma.timeSlot.create({
        data: {
          date,
          slot,
          isAvailable: true,
        }
      });
    }
  }

  console.log('✅ Base de données initialisée avec succès');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Ajouter dans `package.json` :

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Exécuter :

```bash
npm install -D ts-node
npx prisma db seed
```

## Backup & Restore

### Backup

```bash
# Backup complet
pg_dump -U postgres vtc_booking > backup.sql

# Backup avec date
pg_dump -U postgres vtc_booking > backup_$(date +%Y%m%d).sql

# Backup compressé
pg_dump -U postgres vtc_booking | gzip > backup.sql.gz
```

### Restore

```bash
# Restore depuis un fichier
psql -U postgres vtc_booking < backup.sql

# Restore depuis un fichier compressé
gunzip -c backup.sql.gz | psql -U postgres vtc_booking
```

## Bonnes Pratiques

1. **Toujours utiliser des migrations** : Ne jamais modifier directement la BDD
2. **Backup régulier** : Avant chaque migration importante
3. **Tests en dev** : Tester les migrations avec `migrate dev` avant `migrate deploy`
4. **Index les colonnes** : Ajouter des index sur les colonnes souvent requêtées
5. **Soft Delete** : Préférer marquer comme supprimé plutôt que supprimer

## Troubleshooting

### Erreur : "Can't reach database server"
```bash
# Vérifier que PostgreSQL est démarré
# macOS
brew services list
# Linux
sudo systemctl status postgresql

# Redémarrer PostgreSQL
# macOS
brew services restart postgresql@14
# Linux
sudo systemctl restart postgresql
```

### Erreur : "Migration already applied"
```bash
# Voir l'état
npx prisma migrate status

# Résoudre les migrations
npx prisma migrate resolve --applied "migration_name"
```

### Réinitialiser complètement
```bash
# Supprimer les migrations et la BDD
rm -rf prisma/migrations
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Prisma Client pas à jour
```bash
# Régénérer le client
npx prisma generate

# Si problème persiste
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

## Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Studio](https://www.prisma.io/studio)

---

**Pour toute question, consultez la documentation ou contactez le support.**
