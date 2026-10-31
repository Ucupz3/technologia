import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAllAuditLogs() {
  try {
    console.log('🗑️  Menghapus semua audit logs...');
    
    const result = await prisma.audit_logs.deleteMany({});
    
    console.log(`✅ Berhasil menghapus ${result.count} audit logs`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllAuditLogs();
