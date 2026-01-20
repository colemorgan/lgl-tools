import { UpdatePasswordForm } from '@/components/auth/update-password-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Update Password - ZenFlow',
  description: 'Set your new password',
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
