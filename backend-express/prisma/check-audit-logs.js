import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        users: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`\n📊 Total audit logs: ${logs.length}\n`);
    
    if (logs.length === 0) {
      console.log('❌ Tidak ada audit log');
    } else {
      logs.forEach((log, idx) => {
        console.log(`${idx + 1}. ${log.action} ${log.entity_type || 'N/A'} (#${log.entity_id || 'N/A'})`);
        console.log(`   User: ${log.users?.name || 'System'} (ID: ${log.user_id || 'N/A'})`);
        console.log(`   Time: ${log.created_at}`);
        
        try {
          const data = JSON.parse(log.after_data || '{}');
          console.log(`   Module: ${data.module || 'N/A'}`);
          if (data.details) {
            const preview = data.details.substring(0, 60);
            console.log(`   Details: ${preview}${data.details.length > 60 ? '...' : ''}`);
          }
        } catch (e) {
          // ignore
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();
