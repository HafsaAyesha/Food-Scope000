const nodemailer = require('nodemailer');
const config = require('../config');

const isMailConfigured = !!(config.MAIL_HOST && config.MAIL_PORT && config.MAIL_USER && config.MAIL_PASS && config.MAIL_FROM);

let transporter = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: config.MAIL_PORT === 465,
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS
    }
  });
} else {
  console.warn('Mail config not set — email sending is disabled. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM to enable.');
}

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn(`[Mail disabled] Would have sent "${subject}" to ${to}`);
    return;
  }
  await transporter.sendMail({
    from: config.MAIL_FROM,
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
    text: `Please verify your email by visiting the following link: ${url}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Welcome to FoodScope. Please verify your email address by clicking the button below:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">Verify Email</a></p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `
  });
};

const sendResetPasswordEmail = async (user, token) => {
  const url = `${config.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your FoodScope password',
    text: `Use the following link to reset your password: ${url}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to continue:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">Reset Password</a></p>
      <p>If you did not request a password reset, ignore this email.</p>
    `
  });
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
};
