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
  isManaged?: boolean;
  isManagedOwner?: boolean;
}

export function Nav({
  userName,
  userEmail,
  isAdmin,
  isBillingClient,
  isManaged,
  isManagedOwner,
}: NavProps) {
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

  // Billing link: visible for managed owners OR non-managed billing clients
  // Hidden for managed users (non-owner)
  const showBilling = isManagedOwner || (!isManaged && isBillingClient);

  // Team link: visible only for managed workspace owners
  const showTeam = isManagedOwner;

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
            <Link
              href="/dashboard"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === '/dashboard'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === '/account'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              Account
            </Link>
            {showBilling && (
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
            {showTeam && (
              <Link
                href="/team"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === '/team'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Team
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
            {showBilling && (
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/billing">Billing</Link>
              </DropdownMenuItem>
            )}
            {showTeam && (
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/team">Team</Link>
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
