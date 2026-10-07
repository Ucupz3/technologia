import nodemailer from 'nodemailer';

const USE_REAL_EMAIL = process.env.MAIL_HOST && process.env.MAIL_USER;

let transporter = null;

if (USE_REAL_EMAIL) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
}

export async function sendOtpEmail(toEmail, code, userName = 'User') {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e293b;">Kode OTP Login Tekna.id</h2>
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Berikut kode OTP untuk login ke Tekna.id:</p>
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
          ${code}
        </span>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        Kode ini berlaku <strong>5 menit</strong>. Jangan bagikan ke siapa pun.
      </p>
    </div>
  `;

  if (USE_REAL_EMAIL && transporter) {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: toEmail,
      subject: `Kode OTP Login: ${code}`,
      html,
    });
    console.log(`📧 OTP dikirim ke ${toEmail}`);
    return;
  }

  // Fallback: tampilkan di console
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║       KODE OTP LOGIN TEKNA.ID        ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ Email : ${toEmail}`);
  console.log(`║ KODE  : ${code}`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
}
