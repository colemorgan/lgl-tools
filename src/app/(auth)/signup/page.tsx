import { SignupForm } from '@/components/auth/signup-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign Up - ZenFlow',
  description: 'Create your ZenFlow account and start your free trial',
};

export default function SignupPage() {
  return <SignupForm />;
}
