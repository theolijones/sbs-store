import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@studio.local' } });
  if (existing) {
    console.log('Admin user already exists.');
    return;
  }

  const hash = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      email: 'admin@studio.local',
      name: 'Admin',
      password: hash,
      role: 'admin',
    },
  });
  console.log('Created default admin: admin@studio.local / admin');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
