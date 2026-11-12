import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete audit logs with null user_id
  const result = await prisma.audit_logs.deleteMany({
    where: {
      user_id: null
    }
  });

  console.log(`Deleted ${result.count} audit logs with null user_id`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
