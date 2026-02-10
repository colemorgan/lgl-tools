'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface InviteData {
  company_name: string;
  email: string | null;
  is_workspace_invite?: boolean;
}

export function InviteRegistrationForm({ token }: { token: string }) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [validating, setValidating] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInviteData(data);
          if (data.email) {
            setEmail(data.email);
          }
        } else {
          const data = await res.json();
          setInviteError(data.error || 'Invalid invite link');
        }
      })
      .catch(() => {
        setInviteError('Failed to validate invite');
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create account');
      }
    } catch {
      setError('Failed to create account');
    }

    setLoading(false);
  }

  if (validating) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Validating invite...
        </CardContent>
      </Card>
    );
  }

  if (inviteError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>{inviteError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Go to sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Created</CardTitle>
          <CardDescription>
            Your account has been created and linked to {inviteData?.company_name}. You
            can now sign in.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {inviteData?.company_name}</CardTitle>
        <CardDescription>
          {inviteData?.is_workspace_invite
            ? 'Create your account to access your workspace tools.'
            : 'Create your account to get started.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input value={inviteData?.company_name ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!!inviteData?.email}
            />
            {inviteData?.email && (
              <p className="text-xs text-muted-foreground">
                This invite is restricted to this email address.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
