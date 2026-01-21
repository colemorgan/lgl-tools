import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Sign In - Let's Go Live",
  description: "Sign in to your Let's Go Live account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
