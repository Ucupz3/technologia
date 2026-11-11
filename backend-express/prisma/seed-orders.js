import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.roles.findFirst({ where: { name: 'Admin' } });
  if (!role) throw new Error('Admin role not found');

  const user = await prisma.users.findFirst({ where: { role_id: role.id } });
  if (!user) throw new Error('Admin user not found');

  const cust = await prisma.customers.create({
    data: {
      name: 'PT Test Customer',
      email: 'test@customer.com',
      sales_id: user.id,
    }
  });

  const now = new Date();

  // Order 1: Started 5 days ago, ends in 10 days
  const start1 = new Date(now);
  start1.setDate(now.getDate() - 5);
  const end1 = new Date(now);
  end1.setDate(now.getDate() + 10);

  await prisma.orders.create({
    data: {
      order_number: 'ORD-TEST-001',
      customer_id: cust.id,
      sales_id: user.id,
      customer_name_snapshot: 'PT Test Customer',
      status: 'in_progress',
      payment_status: 'unpaid',
      start_date_project: start1,
      end_date_project: end1,
    }
  });

  // Order 2: Starts in 2 days, ends in 20 days
  const start2 = new Date(now);
  start2.setDate(now.getDate() + 2);
  const end2 = new Date(now);
  end2.setDate(now.getDate() + 20);

  await prisma.orders.create({
    data: {
      order_number: 'ORD-TEST-002',
      customer_id: cust.id,
      sales_id: user.id,
      customer_name_snapshot: 'PT Test Customer',
      status: 'pending',
      payment_status: 'unpaid',
      start_date_project: start2,
      end_date_project: end2,
    }
  });

  // Order 3: Started 15 days ago, ends in 5 days
  const start3 = new Date(now);
  start3.setDate(now.getDate() - 15);
  const end3 = new Date(now);
  end3.setDate(now.getDate() + 5);

  await prisma.orders.create({
    data: {
      order_number: 'ORD-TEST-003',
      customer_id: cust.id,
      sales_id: user.id,
      customer_name_snapshot: 'PT Test Customer',
      status: 'in_progress',
      payment_status: 'partial',
      start_date_project: start3,
      end_date_project: end3,
    }
  });

  console.log('3 test orders with project dates created');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
