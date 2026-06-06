import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer
 * Falls back to console logging if SMTP is not configured.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const hasSMTP = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!hasSMTP) {
    console.log('\n======================================================');
    console.log(`[SMTP MOCK LOG] Email to: ${to}`);
    console.log(`[SMTP MOCK LOG] Subject: ${subject}`);
    console.log(`[SMTP MOCK LOG] Body:\n${text}`);
    console.log('======================================================\n');
    return { success: true, mocked: true };
  }

  try {
    const config = process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };

    const transporter = nodemailer.createTransport(config);

    const info = await transporter.sendMail({
      from: `"Veda AI" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email via SMTP: ${error.message}`);
    console.log('\n======================================================');
    console.log(`[FALLBACK LOG] Email to: ${to}`);
    console.log(`[FALLBACK LOG] Subject: ${subject}`);
    console.log(`[FALLBACK LOG] Body:\n${text}`);
    console.log('======================================================\n');
    return { success: true, error: error.message };
  }
};
