import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.users.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      last_login_at: true,
      roles: { select: { name: true } },
    },
    orderBy: { id: 'asc' },
  });

  const formatted = users.map(u => ({
    id: u.id.toString(),
    nama: u.name,
    email: u.email,
    role: u.roles?.name || 'Tanpa Role',
    status: u.status,
    terakhir_login: u.last_login_at ? u.last_login_at.toISOString() : 'Belum pernah login',
  }));

  console.log(JSON.stringify(formatted, null, 2));
  await prisma.$disconnect();
}

run();
