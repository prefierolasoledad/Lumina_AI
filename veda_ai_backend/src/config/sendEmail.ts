import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Veda AI <onboarding@resend.dev>',
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('[Email] Failed to send:', error.message);
    throw new Error(error.message);
  }

  console.log('[Email] Sent:', data?.id);
  return data;
};

// Called on server startup to confirm email is configured
export const verifySMTP = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY is not set — emails will not work.');
  } else {
    console.log('[Email] Resend is configured and ready.');
  }
};
