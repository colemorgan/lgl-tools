import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold">
            ZenFlow
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Professional tools for creators
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
