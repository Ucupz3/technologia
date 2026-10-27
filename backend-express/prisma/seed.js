import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.roles.create({
    data: {
      name: 'Admin',
      description: 'Administrator',
      is_default: true
    }
  });

  const hash = await bcrypt.hash('12345678', 10);
  
  await prisma.users.create({
    data: {
      role_id: role.id,
      name: 'Test User',
      email: 'swastikaaa21@gmail.com',
      password_hash: hash,
      status: 'active'
    }
  });

  console.log('User created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
