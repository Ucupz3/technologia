import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { sendOtpEmail } from '../lib/mailer.js';
import { saveOtp, verifyOtp, removeOtp, getActiveOtp } from '../lib/otpStore.js';

export const authRouter = Router();

// Endpoint bantu dev untuk mengambil OTP aktif saat ini
authRouter.get('/current-otp', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi' });
  const code = getActiveOtp(String(email));
  if (!code) {
    return res.status(404).json({ success: false, message: 'Tidak ada kode OTP aktif' });
  }
  res.json({ success: true, code });
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function mapRoleToSlug(roleName) {
  const map = {
    'Super Admin': 'super_admin',
    'Admin': 'admin',
    'CS': 'cs',
    'Customer Service': 'cs',
    'Finance': 'finance',
  };
  return map[roleName] || 'cs';
}

// ===============================
// POST /api/v1/auth/login
// ===============================
authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        password_hash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun tidak aktif' });
    }

    const normalizedHash = user.password_hash.replace(/^\$2y\$/, '$2b$');
    const cocok = await bcrypt.compare(password, normalizedHash);
    if (!cocok) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const code = generateOtp();
    saveOtp(email, code, user.name);

    try {
      await sendOtpEmail(email, code, user.name);
    } catch (mailErr) {
      console.error('[MAIL ERROR]', mailErr);
      return res.status(500).json({ success: false, message: 'Gagal mengirim email OTP' });
    }

    const isDevOrNoMail = !process.env.MAIL_USER || process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda.',
      data: {
        email: user.email,
        otp_code: isDevOrNoMail ? code : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ===============================
// POST /api/v1/auth/verify-otp
// ===============================
authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const parsed = z
      .object({ email: z.string().email(), code: z.string().length(6) })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Email atau kode OTP tidak valid' });
    }

    const { email, code } = parsed.data;

    const result = verifyOtp(email, code);

    if (!result.ok) {
      const msg =
        result.reason === 'expired'
          ? 'Kode OTP kadaluarsa. Minta kode baru.'
          : 'Kode OTP salah';
      return res.status(401).json({ success: false, message: msg });
    }

    const user = await prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        roles: { select: { name: true } },
      },
    });

    if (!user || user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun tidak aktif' });
    }

    const roleSlug = mapRoleToSlug(user.roles.name);

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role_slug: roleSlug,
        role_name: user.roles.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ===============================
// POST /api/v1/auth/resend-otp
// ===============================
authRouter.post('/resend-otp', async (req, res, next) => {
  try {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Email tidak valid' });
    }

    const { email } = parsed.data;

    const user = await prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: { id: true, name: true, status: true },
    });

    if (!user || user.status !== 'active') {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    removeOtp(email);
    const code = generateOtp();
    saveOtp(email, code, user.name);

    await sendOtpEmail(email, code, user.name);

    const isDevOrNoMail = !process.env.MAIL_USER || process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: 'Kode OTP baru telah dikirim.',
      data: {
        otp_code: isDevOrNoMail ? code : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});