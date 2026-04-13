import nodemailer from 'nodemailer';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[Email] Using Ethereal test account:', testAccount.user);
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const transport = await getTransporter();
    const from = process.env.EMAIL_FROM || 'noreply@onction.com';

    const info = await transport.sendMail({ from, to, subject, html, text });

    if (!process.env.SMTP_HOST) {
      // Log preview URL for Ethereal
      console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Send error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendVendorRegistrationEmail(vendor) {
  return sendEmail({
    to: vendor.email,
    subject: 'Your Vendor Registration Was Received',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2>Registration Submitted</h2>
        <p>Dear ${vendor.firstName || vendor.companyName},</p>
        <p>Your vendor registration has been received and is <strong>Pending Review</strong>.</p>
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#1D4ED8">Your Vendor Code</p>
          <p style="font-family:monospace;font-size:22px;font-weight:700;color:#1E40AF;letter-spacing:0.1em;margin:0">${vendor.id}</p>
          <p style="font-size:12px;color:#3B82F6;margin:8px 0 0">Keep this code — you will use jjit to log in.</p>
        </div>
        <p>An admin will review your application and notify you of the outcome.</p>
      </div>
    `,
    text: `Your vendor code is: ${vendor.id}. Your application is pending review.`,
  });
}

export async function sendStatusChangeEmail(vendor, newStatus, reason = '') {
  const messages = {
    Approved: { subject: 'Your Vendor Application Has Been Approved', body: 'Congratulations! Your vendor account is now approved. You may log in and start submitting invoices.' },
    Rejected: { subject: 'Your Vendor Application Update', body: `Unfortunately, your vendor application was not approved.${reason ? ` Reason: ${reason}` : ' Please contact support for more information.'}` },
    Inactive: { subject: 'Your Vendor Account Has Been Deactivated', body: 'Your vendor account has been set to inactive. Contact support if you believe this is an error.' },
  };
  const msg = messages[newStatus];
  if (!msg || !vendor.email) return;

  return sendEmail({
    to: vendor.email,
    subject: msg.subject,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto"><h2>${msg.subject}</h2><p>Dear ${vendor.firstName || vendor.companyName},</p><p>${msg.body}</p></div>`,
    text: msg.body,
  });
}

export async function sendPasswordResetEmail(email, resetToken, portalType = 'vendor') {
  const link = `http://localhost:5173/${portalType}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2>Reset Your Password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#6B7280;font-size:12px;margin-top:16px">If you didn't request this, ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${link}`,
  });
}