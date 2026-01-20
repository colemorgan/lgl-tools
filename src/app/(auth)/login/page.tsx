import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign In - ZenFlow',
  description: 'Sign in to your ZenFlow account',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
