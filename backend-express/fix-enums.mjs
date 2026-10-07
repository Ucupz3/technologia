// fix-enums.mjs
import fs from 'fs';
import path from 'path';

const ROOTS = ['./src/routes', './src/lib', './src/middlewares'];

const MAP = {
  "'ACTIVE'": "'active'",
  "'INACTIVE'": "'inactive'",
  "'SUSPENDED'": "'suspended'",
  "'PENDING'": "'pending'",
  "'CONFIRMED'": "'in_progress'",
  "'SCHEDULED'": "'pending'",
  "'IN_PROGRESS'": "'in_progress'",
  "'COMPLETED'": "'completed'",
  "'CANCELLED'": "'cancelled'",
  "'UNPAID'": "'unpaid'",
  "'PARTIALLY_PAID'": "'partial'",
  "'PAID'": "'paid'",
  "'REFUNDED'": "'refunded'",
  "'FAILED'": "'failed'",
  "'QUEUED'": "'pending'",
  "'SENT'": "'sent'",
  '"ACTIVE"': '"active"',
  '"INACTIVE"': '"inactive"',
  '"SUSPENDED"': '"suspended"',
  '"PENDING"': '"pending"',
  '"CONFIRMED"': '"in_progress"',
  '"SCHEDULED"': '"pending"',
  '"IN_PROGRESS"': '"in_progress"',
  '"COMPLETED"': '"completed"',
  '"CANCELLED"': '"cancelled"',
  '"UNPAID"': '"unpaid"',
  '"PARTIALLY_PAID"': '"partial"',
  '"PAID"': '"paid"',
  '"REFUNDED"': '"refunded"',
  '"QUEUED"': '"pending"',
  '"SENT"': '"sent"',
  'ACTIVE_OPTIONS': 'active',
};

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (file.endsWith('.js')) process(full);
  }
}

function process(file) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of Object.entries(MAP)) {
    if (src.includes(from)) {
      const before = src;
      src = src.split(from).join(to);
      if (before !== src) changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, src, 'utf8');
    console.log('✅ Fixed:', file);
  }
}

for (const r of ROOTS) walk(r);
console.log('\n🎉 Selesai.');