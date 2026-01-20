import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reset Password - ZenFlow',
  description: 'Reset your ZenFlow account password',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
