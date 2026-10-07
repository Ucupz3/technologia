import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true, email: true, role_id: true, status: true },
    });
    console.log('Users:', users.length, users);

    const services = await prisma.services.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true, price: true, duration: true },
    });
    console.log('Services:', services.length, services);

    const orders = await prisma.orders.findMany({
        where: { deleted_at: null },
        select: { id: true, order_number: true, grand_total: true, status: true },
    });
    console.log('Orders:', orders.length, orders);
    }

    main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });