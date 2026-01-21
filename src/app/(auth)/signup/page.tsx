import { SignupForm } from '@/components/auth/signup-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Sign Up - Let's Go Live",
  description: "Create your Let's Go Live account and start your free trial",
};

export default function SignupPage() {
  return <SignupForm />;
}
