import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend HTTP API.
 * Works on Railway (bypasses SMTP port blocking).
 * Falls back to console logging if RESEND_API_KEY is not configured.
 */
export const sendEmail = async ({ to, subject, text, html }: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  const hasResend = !!process.env.RESEND_API_KEY;

  if (!hasResend) {
    console.log('\n======================================================');
    console.log(`[EMAIL MOCK LOG] Email to: ${to}`);
    console.log(`[EMAIL MOCK LOG] Subject: ${subject}`);
    console.log(`[EMAIL MOCK LOG] Body:\n${text}`);
    console.log('======================================================\n');
    return { success: true, mocked: true };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'Veda AI <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`[Email] Sent successfully: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`[Email] Error sending email: ${error.message}`);
    console.log('\n======================================================');
    console.log(`[FALLBACK LOG] Email to: ${to}`);
    console.log(`[FALLBACK LOG] Subject: ${subject}`);
    console.log(`[FALLBACK LOG] Body:\n${text}`);
    console.log('======================================================\n');
    return { success: false, error: error.message };
  }
};

/**
 * Verifies the email configuration on startup.
 */
export const verifySMTP = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Warning: RESEND_API_KEY is not set. Running in MOCK mode (emails will print to console logs only).');
    return;
  }
  console.log('[Email] Resend API key found. Ready to send emails via Resend.');
};
