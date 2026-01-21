import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Reset Password - Let's Go Live",
  description: "Reset your Let's Go Live account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
