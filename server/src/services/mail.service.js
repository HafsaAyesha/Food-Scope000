const nodemailer = require('nodemailer');
const config = require('../config');

const isMailConfigured = () =>
  !!(config.MAIL_HOST && config.MAIL_PORT && config.MAIL_USER && config.MAIL_PASS && config.MAIL_FROM);

const getTransporter = () => {
  if (!isMailConfigured()) return null;
  return nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: Number(config.MAIL_PORT),
    secure: Number(config.MAIL_PORT) === 465,
    auth: {
      user: config.MAIL_USER,
      pass: (config.MAIL_PASS || '').replace(/\s/g, '')
    }
  });
};

if (!isMailConfigured()) {
  console.warn('Mail config not set — email sending is disabled. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM to enable.');
}

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Mail disabled] Would have sent "${subject}" to ${to}`);
    return;
  }
  await transporter.sendMail({
    from: `FoodScope <${config.MAIL_FROM}>`,
    to,
    subject,
    text,
    html
  });
};

const sendVerificationEmail = async (user, token) => {
  const url = `${config.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your FoodScope account',
    text: `Hi ${user.name}, please verify your email: ${url}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin:0 0 8px;color:#111827;">Welcome to FoodScope 🍽️</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Hi ${user.name}, thanks for signing up! Please verify your email address to activate your account.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Verify Email</a>
        <p style="color:#9ca3af;font-size:0.82rem;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  });
};

const sendResetPasswordEmail = async (user, token) => {
  const url = `${config.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your FoodScope password',
    text: `Hi ${user.name}, reset your password here: ${url}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin:0 0 8px;color:#111827;">Reset your password</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Hi ${user.name}, we received a request to reset your FoodScope password.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Reset Password</a>
        <p style="color:#9ca3af;font-size:0.82rem;margin-top:24px;">This link expires in 30 minutes. If you didn't request a reset, ignore this email.</p>
      </div>
    `
  });
};

module.exports = {
  isMailConfigured,
  sendVerificationEmail,
  sendResetPasswordEmail
};
