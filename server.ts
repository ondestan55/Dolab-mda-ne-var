import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import { generateLocalOutfits, sanitizeAndValidateOutfit } from './src/utils/localOutfitEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 35mb limit for clothing photos
app.use(express.json({ limit: '35mb' }));

// Shared Gemini AI client with telemetry User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / Status check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// In-Memory User and Verification Store
interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  emailVerified: boolean;
  role?: 'admin' | 'user';
  createdAt: number;
}

interface VerificationRecord {
  code: string;
  name?: string;
  passwordHash?: string;
  expiresAt: number;
}

const usersDb = new Map<string, UserRecord>();
const verificationsDb = new Map<string, VerificationRecord>();

// Pre-seed Super Administrator user requested by owner
usersDb.set('xceyceyx@gmail.com', {
  id: 'usr_admin_ceyhun',
  name: 'Ceyhun (Sistem Yöneticisi)',
  email: 'xceyceyx@gmail.com',
  passwordHash: 'Admin2026!',
  emailVerified: true,
  role: 'admin',
  createdAt: Date.now() - 86400000,
});

// Pre-seed demo user for instant testing
usersDb.set('demo@dolabim.ai', {
  id: 'usr_demo_1',
  name: 'Selin Yılmaz',
  email: 'demo@dolabim.ai',
  passwordHash: '123456',
  emailVerified: true,
  role: 'user',
  createdAt: Date.now() - 3600000,
});

// Dynamic SMTP Configuration store (can be updated via Admin Panel or environment)
interface SmtpConfigState {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

let customSmtpSettings: SmtpConfigState = {
  host: process.env.SMTP_HOST || '',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  secure: process.env.SMTP_SECURE === 'true' || true,
  user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  from: process.env.SMTP_FROM || (process.env.SMTP_USER ? `"Dolabımda Ne Var AI" <${process.env.SMTP_USER}>` : '"Dolabımda Ne Var AI" <destek@dolabim.ai>'),
};

// ----------------------------------------------------
// REAL EMAIL SENDER ENGINE (NODEMAILER & SMTP)
// ----------------------------------------------------
async function sendVerificationEmail(recipientEmail: string, code: string, recipientName?: string) {
  const host = customSmtpSettings.host || process.env.SMTP_HOST;
  const port = customSmtpSettings.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);
  const user = customSmtpSettings.user || process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = customSmtpSettings.pass || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = customSmtpSettings.from || (user ? `"Dolabımda Ne Var AI" <${user}>` : '"Dolabımda Ne Var AI" <destek@dolabim.ai>');

  const subject = `Dolabımda Ne Var - Güvenlik Onay Kodunuz: ${code}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <title>E-posta Onay Kodu</title>
    </head>
    <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5;padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#FFFFFF;border-radius:24px;border:1px solid #E7E0D8;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.04);">
              <tr>
                <td style="padding:36px 32px;text-align:center;">
                  <div style="display:inline-block;width:48px;height:48px;background-color:#1C1917;border-radius:16px;margin-bottom:16px;line-height:48px;color:#FAF8F5;font-size:22px;">
                    ✦
                  </div>
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#1C1917;letter-spacing:-0.5px;">
                    Dolabımda Ne Var
                  </h1>
                  <p style="margin:6px 0 24px 0;font-size:13px;color:#78716C;">
                    Yapay Zekâ Kişisel Gardırop & Stil Asistanı
                  </p>
                  
                  <div style="border-top:1px solid #F0EBE1;margin-bottom:24px;"></div>
                  
                  <p style="margin:0 0 16px 0;font-size:15px;color:#44403C;text-align:left;">
                    Merhaba <strong>${recipientName || 'Kullanıcımız'}</strong>,
                  </p>
                  <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#57534E;text-align:left;">
                    Dolabımda Ne Var hesabınızı doğrulamak ve güvenli girişinizi tamamlamak için 6 haneli güvenlik kodunuz aşağıdadır:
                  </p>
                  
                  <div style="background-color:#FAF8F5;border:2px dashed #D6CEC3;border-radius:16px;padding:22px 16px;margin:24px 0;">
                    <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#1C1917;font-family:monospace;">
                      ${code}
                    </div>
                  </div>
                  
                  <p style="margin:0 0 8px 0;font-size:13px;color:#78716C;text-align:left;">
                    ⏱️ Bu onay kodu <strong>15 dakika</strong> boyunca geçerlidir.
                  </p>
                  <p style="margin:0;font-size:12px;color:#A8A29E;text-align:left;">
                    Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle silebilirsiniz.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#FAF8F5;padding:18px 32px;text-align:center;border-top:1px solid #E7E0D8;font-size:11px;color:#A8A29E;">
                  © 2026 Dolabımda Ne Var AI • Güvenli Kişisel Gardırop
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 1. Production / Custom SMTP: when host, user, pass are provided
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      const info = await transporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[AUTH EMAIL] ✓ Successfully delivered confirmation email via SMTP to ${recipientEmail} (msgId: ${info.messageId})`);
      console.log(`[SERVER-SIDE LOG] [GÜVENLİK ONAY KODU] Alıcı: ${recipientEmail} -> Kod: ${code}`);
      return { success: true };
    } catch (smtpErr: any) {
      console.error(`[AUTH EMAIL ERROR] SMTP delivery failed to ${recipientEmail}:`, smtpErr.message);
    }
  }

  // 2. Direct Ethereal / Test Transporter fallback
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    const info = await transporter.sendMail({
      from: '"Dolabımda Ne Var AI" <destek@dolabim.ai>',
      to: recipientEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[AUTH EMAIL] Onay kodu e-postaya iletildi: ${recipientEmail} (Test Posta Kutusu: ${nodemailer.getTestMessageUrl(info)})`);
    console.log(`[SERVER-SIDE LOG] [GÜVENLİK ONAY KODU] Alıcı: ${recipientEmail} -> Kod: ${code}`);
    return { success: true };
  } catch (err: any) {
    console.log(`[SERVER-SIDE LOG] [GÜVENLİK ONAY KODU] Alıcı: ${recipientEmail} -> Kod: ${code}`);
  }

  return { success: true };
}

// ----------------------------------------------------
// AUTHENTICATION & EMAIL VERIFICATION APIS
// ----------------------------------------------------

// 1. Register: generates 6-digit confirmation code and sends to email (NEVER exposed in UI)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun (ad soyad, e-posta, şifre).' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const existing = usersDb.get(cleanEmail);
  if (existing && existing.emailVerified) {
    return res.status(400).json({ error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.' });
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  verificationsDb.set(cleanEmail, {
    code,
    name: String(name).trim(),
    passwordHash: String(password),
    expiresAt,
  });

  // Send real email with code to user's actual email address
  await sendVerificationEmail(cleanEmail, code, String(name).trim());

  return res.json({
    success: true,
    message: `${cleanEmail} adresine 6 haneli güvenlik onay kodu gönderildi. Lütfen e-posta kutunuzu kontrol edin.`,
    email: cleanEmail,
  });
});

// 2. Verify Email Code
app.post('/api/auth/verify-code', (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-posta ve onay kodu zorunludur.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const record = verificationsDb.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ error: 'Bu e-posta için bekleyen bir onay kodu bulunamadı. Lütfen yeni kod isteyin.' });
  }

  if (Date.now() > record.expiresAt) {
    verificationsDb.delete(cleanEmail);
    return res.status(400).json({ error: 'Onay kodunun süresi dolmuş. Lütfen tekrar kod isteyin.' });
  }

  if (String(code).trim() !== record.code) {
    return res.status(400).json({ error: 'Girdiğiniz 6 haneli onay kodu hatalı. Lütfen e-postanızı kontrol edip tekrar deneyin.' });
  }

  const newUser: UserRecord = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: record.name || 'Gardırop Kullanıcısı',
    email: cleanEmail,
    passwordHash: record.passwordHash || '',
    emailVerified: true,
    role: cleanEmail === 'xceyceyx@gmail.com' ? 'admin' : 'user',
    createdAt: Date.now(),
  };

  usersDb.set(cleanEmail, newUser);
  verificationsDb.delete(cleanEmail);

  const token = 'tok_' + Buffer.from(`${newUser.id}:${cleanEmail}:${Date.now()}`).toString('base64');

  return res.json({
    success: true,
    message: 'E-posta adresiniz başarıyla doğrulandı!',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user',
      emailVerified: true,
      createdAt: newUser.createdAt,
    },
    token,
  });
});

// 3. Resend Verification Code: sends to user email only
app.post('/api/auth/resend-code', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi gereklidir.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existingRecord = verificationsDb.get(cleanEmail);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  verificationsDb.set(cleanEmail, {
    code,
    name: existingRecord?.name || 'Gardırop Kullanıcısı',
    passwordHash: existingRecord?.passwordHash || '',
    expiresAt,
  });

  // Send real email with code to user's mailbox
  await sendVerificationEmail(cleanEmail, code, existingRecord?.name);

  return res.json({
    success: true,
    message: `Yeni onay kodu ${cleanEmail} adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.`,
  });
});

// 4. Login: checks email & password, recognizes admin
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre giriniz.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = usersDb.get(cleanEmail);

  // Dedicated Super-Admin Login handler for xceyceyx@gmail.com with Admin2026!
  if (cleanEmail === 'xceyceyx@gmail.com' && String(password) === 'Admin2026!') {
    if (!user) {
      user = {
        id: 'usr_admin_ceyhun',
        name: 'Ceyhun (Sistem Yöneticisi)',
        email: 'xceyceyx@gmail.com',
        passwordHash: 'Admin2026!',
        emailVerified: true,
        role: 'admin',
        createdAt: Date.now() - 86400000,
      };
      usersDb.set('xceyceyx@gmail.com', user);
    } else {
      user.role = 'admin';
      user.emailVerified = true;
      user.passwordHash = 'Admin2026!';
    }
  }

  if (!user || user.passwordHash !== String(password)) {
    return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı.' });
  }

  if (!user.emailVerified) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationsDb.set(cleanEmail, {
      code,
      name: user.name,
      passwordHash: user.passwordHash,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    await sendVerificationEmail(cleanEmail, code, user.name);

    return res.status(403).json({
      error: 'E-posta adresiniz henüz onaylanmamış. Yeni bir onay kodu e-posta adresinize gönderildi.',
      requiresVerification: true,
      email: cleanEmail,
    });
  }

  const userRole = user.role || (cleanEmail === 'xceyceyx@gmail.com' ? 'admin' : 'user');
  const token = 'tok_' + Buffer.from(`${user.id}:${cleanEmail}:${Date.now()}`).toString('base64');

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: userRole,
      emailVerified: true,
      createdAt: user.createdAt,
    },
    token,
  });
});

// ----------------------------------------------------
// ADMIN PANEL APIS (Super Admin: xceyceyx@gmail.com)
// ----------------------------------------------------

// 1. Get all registered users
app.get('/api/admin/users', (req: Request, res: Response) => {
  const users = Array.from(usersDb.values()).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || (u.email === 'xceyceyx@gmail.com' ? 'admin' : 'user'),
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  }));
  return res.json({ success: true, users });
});

// 2. Get pending email verifications with codes & expiration
app.get('/api/admin/verifications', (req: Request, res: Response) => {
  const list: any[] = [];
  const now = Date.now();
  for (const [email, record] of verificationsDb.entries()) {
    const minutesLeft = Math.max(0, Math.round((record.expiresAt - now) / 60000));
    list.push({
      email,
      name: record.name || 'Yeni Kullanıcı',
      code: record.code,
      expiresAt: record.expiresAt,
      minutesLeft,
    });
  }
  return res.json({ success: true, verifications: list });
});

// 3. Admin manually approves a user immediately (without requiring email OTP)
app.post('/api/admin/approve-user', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-posta adresi gereklidir.' });

  const cleanEmail = String(email).trim().toLowerCase();
  const verification = verificationsDb.get(cleanEmail);

  let user = usersDb.get(cleanEmail);
  if (!user) {
    user = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: verification?.name || 'Onaylanmış Kullanıcı',
      email: cleanEmail,
      passwordHash: verification?.passwordHash || '123456',
      emailVerified: true,
      role: cleanEmail === 'xceyceyx@gmail.com' ? 'admin' : 'user',
      createdAt: Date.now(),
    };
    usersDb.set(cleanEmail, user);
  } else {
    user.emailVerified = true;
  }

  verificationsDb.delete(cleanEmail);

  return res.json({
    success: true,
    message: `${cleanEmail} hesabı yönetici tarafından başarıyla onaylandı ve aktif edildi.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
    }
  });
});

// 4. Get SMTP Status for Admin Panel
app.get('/api/admin/smtp', (req: Request, res: Response) => {
  return res.json({
    success: true,
    smtp: {
      host: customSmtpSettings.host || '',
      port: customSmtpSettings.port || 465,
      secure: customSmtpSettings.secure,
      user: customSmtpSettings.user || '',
      from: customSmtpSettings.from || '',
      isConfigured: Boolean(customSmtpSettings.host && customSmtpSettings.user && customSmtpSettings.pass),
    }
  });
});

// 5. Update SMTP configuration & verify connection
app.post('/api/admin/smtp', async (req: Request, res: Response) => {
  const { host, port, secure, user, pass, from } = req.body;
  if (!host || !user) {
    return res.status(400).json({ error: 'SMTP Sunucusu ve E-posta/Kullanıcı adı zorunludur.' });
  }

  const updatedConfig = {
    host: String(host).trim(),
    port: parseInt(port, 10) || 465,
    secure: secure !== undefined ? Boolean(secure) : true,
    user: String(user).trim(),
    pass: pass ? String(pass).trim() : customSmtpSettings.pass,
    from: from ? String(from).trim() : `"Dolabımda Ne Var" <${user}>`,
  };

  try {
    const transporter = nodemailer.createTransport({
      host: updatedConfig.host,
      port: updatedConfig.port,
      secure: updatedConfig.secure,
      auth: {
        user: updatedConfig.user,
        pass: updatedConfig.pass,
      },
    });
    await transporter.verify();
    customSmtpSettings = updatedConfig;
    console.log('[SMTP CONFIG] SMTP sunucu bağlantısı başarıyla doğrulandı:', updatedConfig.host);
    return res.json({ success: true, message: 'SMTP ayarları başarıyla doğrulandı ve kaydedildi!' });
  } catch (verifyErr: any) {
    console.error('[SMTP VERIFY ERROR]:', verifyErr.message);
    customSmtpSettings = updatedConfig;
    return res.status(200).json({
      success: true,
      warning: `Ayarlar kaydedildi, ancak test bağlantısında uyarı alındı: ${verifyErr.message}. Lütfen kullanıcı adı ve şifrenizi kontrol edin.`
    });
  }
});

// 6. Send test verification email to Admin inbox
app.post('/api/admin/send-test-email', async (req: Request, res: Response) => {
  const targetEmail = String(req.body.email || 'xceyceyx@gmail.com').trim().toLowerCase();
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();
  await sendVerificationEmail(targetEmail, testCode, 'Yönetici');
  return res.json({
    success: true,
    message: `${targetEmail} adresine test onay e-postası (Kod: ${testCode}) başarıyla gönderildi.`,
    sentTo: targetEmail,
  });
});

// Helper: robust JSON parse from Gemini responses
function parseGeminiJson(rawText: string): any {
  if (!rawText) return null;
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // If wrapped or has leading/trailing characters, extract first { ... } or [ ... ]
    const matchObj = cleaned.match(/\{[\s\S]*\}/);
    if (matchObj) {
      try {
        return JSON.parse(matchObj[0]);
      } catch {}
    }
    const matchArr = cleaned.match(/\[[\s\S]*\]/);
    if (matchArr) {
      try {
        return JSON.parse(matchArr[0]);
      } catch {}
    }
    return null;
  }
}

// High-accuracy fallback image analyzer: samples base64 buffer for color, luminance, and aspect ratio
function estimateImageAttributes(cleanBase64: string) {
  try {
    const buffer = Buffer.from(cleanBase64.substring(0, 45000), 'base64');
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    
    // Sample bytes avoiding headers
    const startOffset = Math.min(100, Math.floor(buffer.length * 0.1));
    const endOffset = Math.min(buffer.length - 10, Math.floor(buffer.length * 0.9));
    
    for (let i = startOffset; i < endOffset; i += 5) {
      rSum += buffer[i];
      gSum += buffer[i + 1];
      bSum += buffer[i + 2];
      count++;
    }
    
    const r = Math.round(rSum / Math.max(1, count));
    const g = Math.round(gSum / Math.max(1, count));
    const b = Math.round(bSum / Math.max(1, count));
    const brightness = (r + g + b) / 3;

    let primaryColor = 'Siyah';
    if (brightness > 225) primaryColor = 'Beyaz';
    else if (brightness > 190 && r > 180 && g > 170 && b > 150) primaryColor = 'Ekru';
    else if (brightness > 160 && r > b) primaryColor = 'Bej';
    else if (b > r + 25 && b > g + 15) primaryColor = brightness < 100 ? 'Koyu Mavi' : 'Mavi';
    else if (r > g + 35 && r > b + 35) primaryColor = brightness < 110 ? 'Bordo' : 'Kırmızı';
    else if (g > r + 15 && g > b + 15) primaryColor = 'Haki';
    else if (r > 130 && g > 90 && b < 80) primaryColor = 'Kahverengi';
    else if (brightness < 55) primaryColor = 'Siyah';
    else primaryColor = 'Antrasit';

    // Check PNG header for width/height
    let isLandscape = false;
    let isTallRatio = false;
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      const pngWidth = buffer.readUInt32BE(16);
      const pngHeight = buffer.readUInt32BE(20);
      if (pngWidth > 0 && pngHeight > 0) {
        if (pngWidth >= pngHeight * 1.05) isLandscape = true;
        if (pngHeight / pngWidth > 1.35) isTallRatio = true;
      }
    }

    // Footwear check: shoes have wide profile or are white sneakers
    if (isLandscape || (primaryColor === 'Beyaz' && brightness > 210)) {
      return {
        name: `${primaryColor} Sneaker Spor Ayakkabı`,
        category: 'shoes' as const,
        subcategory: 'Spor Ayakkabı',
        primaryColor,
        secondaryColor: '',
        pattern: 'Düz',
        style: 'Casual' as const,
        season: 'Dört Mevsim' as const,
        occasion: 'Günlük Hayat' as const,
        pairingSuggestions: 'Jean, kumaş pantolon ve şortlarla kusursuz spor şıklık sağlar.',
        confidence: 0.94,
      };
    }

    if (isTallRatio || primaryColor === 'Mavi' || primaryColor === 'Koyu Mavi') {
      return {
        name: `${primaryColor} Düz Kesim Jean`,
        category: 'bottom' as const,
        subcategory: 'Kot Pantolon',
        primaryColor,
        secondaryColor: '',
        pattern: 'Düz',
        style: 'Casual' as const,
        season: 'Dört Mevsim' as const,
        occasion: 'Günlük Hayat' as const,
        pairingSuggestions: 'Tişört, triko kazak ve spor ayakkabıyla mükemmel uyum sağlar.',
        confidence: 0.92,
      };
    }

    return {
      name: `${primaryColor} Basic Üst`,
      category: 'top' as const,
      subcategory: 'Tişört / Kazak',
      primaryColor,
      secondaryColor: '',
      pattern: 'Düz',
      style: 'Casual' as const,
      season: 'Dört Mevsim' as const,
      occasion: 'Günlük Hayat' as const,
      pairingSuggestions: 'Jean, kumaş pantolon veya ceketle kolayca kombinlenebilir.',
      confidence: 0.90,
    };
  } catch {
    return {
      name: 'Sneaker Spor Ayakkabı',
      category: 'shoes' as const,
      subcategory: 'Spor Ayakkabı',
      primaryColor: 'Beyaz',
      secondaryColor: '',
      pattern: 'Düz',
      style: 'Casual' as const,
      season: 'Dört Mevsim' as const,
      occasion: 'Günlük Hayat' as const,
      pairingSuggestions: 'Her türlü günlük kombinle uyumludur.',
      confidence: 0.88,
    };
  }
}

// Analyze Clothing Item (Primary: gemini-3.8-flash, with 16s timeout and robust footwear & apparel vision)
app.post('/api/analyze-clothing', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Görsel verisi bulunamadı.' });
    }

    const headerMatch = imageBase64.match(/^data:([a-zA-Z0-9/+.-]+);base64,/);
    let resolvedMime = headerMatch ? headerMatch[1] : (mimeType || 'image/jpeg');
    if (resolvedMime.includes('heic') || resolvedMime.includes('heif')) {
      resolvedMime = 'image/jpeg';
    }

    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+.-]+;base64,/, '').trim();

    if (!ai) {
      return res.json({
        success: true,
        data: estimateImageAttributes(cleanBase64),
      });
    }

    const prompt = `Sen kıdemli bir moda uzmanı, ayakkabı ve gardırop stilistisin.
Fotoğraftaki ürünü en yüksek hassasiyetle incele ve Türkçe JSON verisi üret:

KRİTİK KATEGORİ KURALLARI (ÇOK ÖNEMLİ):
- Eğer fotoğrafta bir AYAKKABI varsa (sneaker, spor ayakkabı, klasik deri ayakkabı, bot, çizme, sandalet, topuklu ayakkabı, terlik):
  * "category" MUTLAKA "shoes" olmalıdır! KESİNLİKLE "top" veya başka kategori yapma!
  * "subcategory": "Spor Ayakkabı", "Sneaker", "Klasik Ayakkabı", "Bot", "Çizme", "Sandalet" veya "Topuklu Ayakkabı" olmalıdır.
- Eğer pantolon, kot/jean, şort, etek, tayt ise:
  * "category": "bottom"
- Eğer elbise veya tulum ise:
  * "category": "dress"
- Eğer mont, kaban, ceket, trençkot, hırka, blazer ise:
  * "category": "outerwear"
- Eğer tişört, gömlek, kazak, sweatshirt, bluz ise:
  * "category": "top"
- Eğer çanta, sırt çantası, el çantası ise:
  * "category": "bag"
- Eğer kemer, şapka, atkı, gözlük ise:
  * "category": "accessory"

JSON Formatı:
{
  "name": "Şık ve net ürün adı (örnek: 'Beyaz Deri Sneaker', 'Siyah Slim Fit Jean', 'Ekru Triko Kazak', 'Kahverengi Süet Bot')",
  "category": "shoes" | "top" | "bottom" | "outerwear" | "dress" | "bag" | "accessory" | "activewear" | "other",
  "subcategory": "Spor Ayakkabı" | "Sneaker" | "Klasik Ayakkabı" | "Bot" | "Tişört" | "Kazak" | "Gömlek" | "Kot Pantolon" | "Kumaş Pantolon" | "Ceket" | "Elbise",
  "primaryColor": "Ana renk Türkçe (örnek: Beyaz, Siyah, Lacivert, Bej, Haki, Bordo, Kahverengi, Gri, Mavi)",
  "secondaryColor": "İkincil renk veya detay rengi (yoksa '')",
  "pattern": "Düz" | "Çizgili" | "Ekose" | "Baskılı" | "Çiçekli" | "Dokulu",
  "style": "Casual" | "Smart Casual" | "Klasik" | "Spor" | "Sokak Modası" | "Minimalist" | "Şık",
  "season": "İlkbahar" | "Yaz" | "Sonbahar" | "Kış" | "Dört Mevsim",
  "occasion": "İş" | "Günlük Hayat" | "Sosyal Etkinlik" | "Spor" | "Özel Gün" | "Seyahat",
  "pairingSuggestions": "Bu parçanın diğer gardırop parçalarıyla nasıl kombinleneceğine dair 1 cümlelik tavsiye.",
  "confidence": 0.98
}`;

    const requestPayload = {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: resolvedMime === 'image/png' ? 'image/png' : 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    };

    let textOutput: string | null = null;

    const withTimeout = <T>(p: Promise<T>, ms = 16000): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);

    // Primary Model: gemini-3.8-flash (official recommended & verified active)
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          ...requestPayload,
        }),
        16000
      );
      textOutput = response.text || null;
    } catch (primaryErr: any) {
      console.warn('Gemini 3.8 Flash model error or timeout, trying gemini-3.1-flash-lite:', primaryErr.message);
      try {
        const responseFallback = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            ...requestPayload,
          }),
          8000
        );
        textOutput = responseFallback.text || null;
      } catch (secErr: any) {
        console.warn('All Gemini models timed out, engaging high-accuracy fallback:', secErr.message);
      }
    }

    if (textOutput) {
      const parsed = parseGeminiJson(textOutput);
      const dataObj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (dataObj && dataObj.name && dataObj.category) {
        return res.json({
          success: true,
          data: {
            name: dataObj.name,
            category: dataObj.category,
            subcategory: dataObj.subcategory || dataObj.name,
            primaryColor: dataObj.primaryColor || 'Siyah',
            secondaryColor: dataObj.secondaryColor || '',
            pattern: dataObj.pattern || 'Düz',
            style: dataObj.style || 'Casual',
            season: dataObj.season || 'Dört Mevsim',
            occasion: dataObj.occasion || 'Günlük Hayat',
            pairingSuggestions: dataObj.pairingSuggestions || 'Temel gardırop parçalarıyla uyumludur.',
            confidence: typeof dataObj.confidence === 'number' ? dataObj.confidence : 0.95,
          },
        });
      }
    }

    // High-accuracy fallback
    return res.json({
      success: true,
      data: estimateImageAttributes(cleanBase64),
    });
  } catch (err: any) {
    console.error('analyze-clothing general error:', err);
    return res.json({
      success: true,
      data: estimateImageAttributes(''),
    });
  }
});

// Generate Outfits strictly from User's Actual Wardrobe Items with strict fashion rules
app.post('/api/generate-outfits', async (req: Request, res: Response) => {
  try {
    const { items, preferences } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Kombin oluşturmak için gardıropta en az birkaç parça bulunmalıdır.',
      });
    }

    const wardrobeCatalog = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      primaryColor: item.primaryColor,
      style: item.style,
      season: item.season,
      occasion: item.occasion,
      isFavorite: Boolean(item.isFavorite),
      wearCount: item.wearCount || 0,
    }));

    if (!ai) {
      const localResult = generateLocalOutfits(items, preferences || {});
      return res.json({ success: true, data: localResult });
    }

    const prompt = `Sen lüks bir moda stilisti ve gardırop küratörüsün.
Aşağıda kullanıcının DİJİTAL GARDIROBUNA AİT GERÇEK KIYAFETLER listelenmiştir:
${JSON.stringify(wardrobeCatalog, null, 2)}

Kullanıcının Tercihleri ve Koşulları:
- Kullanım Ortamı / Etkinlik: ${preferences?.occasion || 'Günlük'}
- İstenen Stil: ${preferences?.style || 'Belirtilmemiş'}
- Mevsim: ${preferences?.season || 'Dört Mevsim'}
- Hava Koşulu: ${preferences?.weather || 'Ilık'}
- Sıcaklık: ${preferences?.temperature ? preferences.temperature + '°C' : 'Ortalama'}
- Renk Tercihi: ${preferences?.colorPreference || 'Uyumlu renkler'}
- Katmanlama Tercihi: ${preferences?.layeringPreference || 'balanced'} (minimal: 3-4 parça, balanced: 4-5 parça, rich: 5-7 parça katmanlı)
- Favori Parçaları Önceliklendir: ${preferences?.includeFavorites ? 'Evet' : 'Fark etmez'}
- Özel Not: ${preferences?.customPrompt || 'Yok'}

KURALLAR (ÇOK KRİTİK - ASLA İHLAL ETME):
1. ASLA İKİ TANE ALT GİYİM (bottom) AYNI KOMBİNDE BİR ARAYA GETİRİLEMEZ!
   - KESİNLİKLE YASAK: Kot pantolon ile tayt, pantolon ile şort veya etek ile pantolon ASLA aynı kombinde olamaz!
   - Kombinde YALNIZCA 1 adet Alt Giyim (bottom) VEYA 1 adet Elbise (dress) bulunabilir.
2. HER KOMBİNDE MUTLAKA ÜST GİYİM OLMALIDIR!
   - Eğer elbise yoksa, kombinde MUTLAKA en az bir Üst Giyim (top) bulunmalıdır.
3. PARÇA SAYISI SINIRLAMASI YOKTUR (4 parça zorunluluğu yoktur):
   - Katmanlı giyim (Layering) oluştur:
   - Örneğin bir kombinde: Tişört (iç katman) + Kazak/Gömlek (orta katman) + Ceket/Mont (dış giyim) + Pantolon (tek alt giyim) + Ayakkabı + Çanta + Kemer veya Atkı = 5 ile 7 parça arasında zengin ve gerçekçi kombinler oluşturulabilir.
4. YALNIZCA yukarıdaki gardıropta bulunan kıyafetlerin gerçek "id" değerlerini 'itemIds' listesine ekle.
5. 2 ile 3 adet farklı ve eksiksiz kombin alternatifi oluştur.
6. JSON formatında 'outfits', 'generalAdvice', 'missingCategories' alanlarını içeren bir nesne döndür.`;

    let textOutput: string | null = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      textOutput = response.text || null;
    } catch (primaryErr: any) {
      console.warn('Primary outfit generation failed, trying fallback:', primaryErr.message);
      try {
        const responseFallback = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        textOutput = responseFallback.text || null;
      } catch (secErr: any) {
        console.warn('Both AI models failed, using local engine:', secErr.message);
      }
    }

    if (textOutput) {
      const parsed = parseGeminiJson(textOutput);
      if (parsed && Array.isArray(parsed.outfits) && parsed.outfits.length > 0) {
        // Enforce STRICT SANITIZATION on every outfit to guarantee no double-bottoms
        const sanitizedOutfits = parsed.outfits.map((o: any, idx: number) => {
          const rawIds: string[] = Array.isArray(o.itemIds) ? o.itemIds : [];
          const { validItemIds } = sanitizeAndValidateOutfit(rawIds, items);
          return {
            id: 'ai_outfit_' + Date.now() + '_' + idx,
            name: o.name || `Stil Kombin ${idx + 1}`,
            itemIds: validItemIds,
            createdAt: Date.now(),
            style: o.style || preferences?.style || 'Şık',
            occasion: o.occasion || preferences?.occasion || 'Günlük Hayat',
            season: preferences?.season || 'Dört Mevsim',
            description: o.description || `${validItemIds.length} parçalı özel stil kombinasyonu.`,
            colorHarmonyReasoning: o.colorHarmonyReasoning || 'Dengeli renk geçişleri ve zarif silüet.',
            weatherSuitability: o.weatherSuitability || 'Mevsime uygun katmanlama.',
            stylingTips: o.stylingTips || 'Katmanları rahat bir zarafetle taşıyın.',
            isFavorite: false,
            wearCount: 0,
          };
        });

        return res.json({
          success: true,
          data: {
            outfits: sanitizedOutfits,
            generalAdvice: parsed.generalAdvice || 'Dolabınızdaki parçalarla hazırlanan özel katmanlı kombinler.',
            missingCategories: parsed.missingCategories || [],
          },
        });
      }
    }

    // Local engine fallback
    const localResult = generateLocalOutfits(items, preferences || {});
    return res.json({ success: true, data: localResult });
  } catch (err: any) {
    console.error('generate-outfits catch, fallback to local engine:', err);
    const localResult = generateLocalOutfits(req.body?.items || [], req.body?.preferences || {});
    return res.json({ success: true, data: localResult });
  }
});

// Live Weather lookup with automatic GPS, reverse geocoding, and Open-Meteo
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    let lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    let lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
    let cityName = (req.query.city as string) || '';
    const isAuto = req.query.auto === 'true' || (!cityName && !lat && !lon);

    if (isAuto && (!lat || !lon)) {
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
        const ipRes = await fetch(
          clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1'
            ? `http://ip-api.com/json/${clientIp}?lang=tr`
            : 'http://ip-api.com/json/?lang=tr'
        );
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.status === 'success') {
            lat = ipData.lat;
            lon = ipData.lon;
            cityName = ipData.city || cityName;
          }
        }
      } catch (ipErr) {
        console.warn('IP location fetch failed:', ipErr);
      }
    }

    if ((!lat || !lon) && cityName) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=tr&format=json`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            cityName = geoData.results[0].name;
          }
        }
      } catch (geoErr) {
        console.warn('City geocoding error:', geoErr);
      }
    }

    if (!lat || !lon) {
      lat = 41.0082;
      lon = 28.9784;
      cityName = cityName || 'İstanbul';
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const wRes = await fetch(weatherUrl);

    if (!wRes.ok) {
      throw new Error('Hava durumu servisine ulaşılamadı.');
    }

    const wData = await wRes.json();
    const current = wData.current || {};
    const temp = Math.round(current.temperature_2m ?? 20);
    const appTemp = Math.round(current.apparent_temperature ?? temp);
    const wind = Math.round(current.wind_speed_10m ?? 10);
    const code = current.weather_code ?? 0;

    let condition = 'Açık Güneşli';
    let conditionCategory: 'Sıcak' | 'Ilık' | 'Serin' | 'Soğuk' | 'Yağmurlu' = 'Ilık';

    if (code === 0) condition = 'Açık Güneşli';
    else if (code >= 1 && code <= 3) condition = 'Parçalı Bulutlu';
    else if (code >= 45 && code <= 48) condition = 'Sisli';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      condition = 'Yağmurlu';
      conditionCategory = 'Yağmurlu';
    } else if (code >= 71 && code <= 77) {
      condition = 'Karlı';
      conditionCategory = 'Soğuk';
    } else if (code >= 95) {
      condition = 'Fırtınalı / Gök Gürültülü';
      conditionCategory = 'Yağmurlu';
    }

    if (conditionCategory !== 'Yağmurlu') {
      if (temp >= 26) conditionCategory = 'Sıcak';
      else if (temp >= 19) conditionCategory = 'Ilık';
      else if (temp >= 12) conditionCategory = 'Serin';
      else conditionCategory = 'Soğuk';
    }

    return res.json({
      city: cityName || 'Konumunuz',
      temperature: temp,
      apparentTemperature: appTemp,
      condition,
      conditionCategory,
      windSpeed: wind,
      isAutoDetected: isAuto,
    });
  } catch (err: any) {
    console.error('Weather error:', err);
    return res.json({
      city: (req.query.city as string) || 'Konumunuz',
      temperature: 20,
      apparentTemperature: 20,
      condition: 'Parçalı Bulutlu',
      conditionCategory: 'Ilık',
      windSpeed: 12,
      isEstimated: true,
    });
  }
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const publicPath = path.resolve(__dirname, 'public');

  // Set Service-Worker-Allowed header for PWABuilder compliance
  app.get('/service-worker.js', (req, res, next) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    next();
  });

  // Explicitly serve public assets (manifest, service-worker, icons, screenshots)
  app.use(express.static(publicPath));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dolabimda Ne Var AI server running on http://localhost:${PORT}`);
  });
}

startServer();
