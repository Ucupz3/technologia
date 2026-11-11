import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin role
  const superAdminRole = await prisma.roles.create({
    data: {
      name: 'Super Admin',
      description: 'Super Administrator',
      is_default: false
    }
  });

  // Create Admin role
  const adminRole = await prisma.roles.create({
    data: {
      name: 'Admin',
      description: 'Administrator',
      is_default: true
    }
  });

  const hash = await bcrypt.hash('12345678', 10);
  
  // Super Admin user
  await prisma.users.create({
    data: {
      role_id: superAdminRole.id,
      name: 'Super Admin',
      email: 'amrullahcheetah@gmail.com',
      password_hash: hash,
      status: 'active'
    }
  });

  // Admin user
  await prisma.users.create({
    data: {
      role_id: adminRole.id,
      name: 'Test User',
      email: 'swastikaaa21@gmail.com',
      password_hash: hash,
      status: 'active'
    }
  });

  console.log('Users created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
