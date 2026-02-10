'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

interface NavProps {
  userName: string | null;
  userEmail: string;
  isAdmin?: boolean;
  isBillingClient?: boolean;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/account', label: 'Account' },
];

export function Nav({ userName, userEmail, isAdmin, isBillingClient }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || '?';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo height={32} href="/dashboard" />
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isBillingClient && (
              <Link
                href="/billing"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === '/billing'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Billing
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname.startsWith('/admin')
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              {userName && (
                <p className="text-sm font-medium leading-none">{userName}</p>
              )}
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="md:hidden">
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="md:hidden">
              <Link href="/account">Account</Link>
            </DropdownMenuItem>
            {isBillingClient && (
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/billing">Billing</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="md:hidden" />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
