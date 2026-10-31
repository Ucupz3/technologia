import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Find Super Admin role
  let superAdminRole = await prisma.roles.findFirst({
    where: { name: 'Super Admin' }
  });

  // Create if not exists
  if (!superAdminRole) {
    superAdminRole = await prisma.roles.create({
      data: {
        name: 'Super Admin',
        description: 'Super Administrator',
        is_default: false
      }
    });
    console.log('Super Admin role created');
  }

  // Check if user exists
  const existing = await prisma.users.findFirst({
    where: { email: 'amrullahcheetah@gmail.com' }
  });

  if (existing) {
    console.log('User already exists');
    return;
  }

  const hash = await bcrypt.hash('12345678', 10);
  
  await prisma.users.create({
    data: {
      role_id: superAdminRole.id,
      name: 'Super Admin',
      email: 'amrullahcheetah@gmail.com',
      password_hash: hash,
      status: 'active'
    }
  });

  console.log('Super Admin user created: amrullahcheetah@gmail.com / 12345678');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
