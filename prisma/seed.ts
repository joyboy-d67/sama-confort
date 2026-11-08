import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const clientEmail = 'test@example.com';
  const clientPassword = await bcrypt.hash('password123', 10);

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '0612345678',
      role: 'USER',
    },
    create: {
      email: clientEmail,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '0612345678',
      password: clientPassword,
      role: 'USER',
    },
  });

  const driverEmail = 'afatahallah84@gmail.com';
  // Le mot de passe réel vit dans .env (non versionné), jamais dans le code.
  const driverPlainPassword = process.env.SEED_DRIVER_PASSWORD;
  if (!driverPlainPassword) {
    throw new Error('SEED_DRIVER_PASSWORD manquant dans .env : impossible de créer le compte chauffeur.');
  }
  const driverPassword = await bcrypt.hash(driverPlainPassword, 10);

  const driver = await prisma.user.upsert({
    where: { email: driverEmail },
    update: {
      firstName: 'Chauffeur',
      lastName: 'Principal',
      phoneNumber: '0600000000',
      role: 'DRIVER',
      password: driverPassword,
    },
    create: {
      email: driverEmail,
      name: 'Chauffeur Principal',
      firstName: 'Chauffeur',
      lastName: 'Principal',
      phoneNumber: '0600000000',
      password: driverPassword,
      role: 'DRIVER',
    },
  });

  console.log({ client, driver });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
