import { Resend } from 'resend';

// Lazy initialization to avoid issues when env vars aren't set
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const resend = getResendClient();

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'LGL Tools <noreply@lgltools.com>';

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    react,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
