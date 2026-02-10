import { Logo } from '@/components/ui/logo';

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo height={40} />
          <p className="mt-4 text-sm text-muted-foreground">
            Professional tools for creators
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
