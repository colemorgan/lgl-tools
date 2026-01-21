import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  height?: number;
  href?: string;
  className?: string;
}

export function Logo({ height = 32, href = '/', className }: LogoProps) {
  const logo = (
    <Image
      src="/logo.png"
      alt="Let's Go Live"
      width={Math.round(height * 4.5)}
      height={height}
      className={className}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logo}
      </Link>
    );
  }

  return logo;
}
