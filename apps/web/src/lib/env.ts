/**
 * Environment variable validation
 *
 * This module validates that required environment variables are set.
 * It should be imported at application startup.
 */

interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_PRICE_ID: string;

  // Resend
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;

  // Vercel Cron
  CRON_SECRET: string;

  // Cloudflare Stream
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_CUSTOMER_SUBDOMAIN: string;
  CLOUDFLARE_WEBHOOK_SECRET?: string;

  // App
  NEXT_PUBLIC_APP_URL: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_ID',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_CUSTOMER_SUBDOMAIN',
  'NEXT_PUBLIC_APP_URL',
];

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check for optional but recommended variables
  if (!process.env.RESEND_FROM_EMAIL) {
    warnings.push('RESEND_FROM_EMAIL not set, using default email');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvVar(key: keyof EnvConfig): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Validates environment and throws if required variables are missing.
 * Use this in server components or API routes where you need to fail fast.
 */
export function requireEnv(): void {
  const result = validateEnv();
  if (!result.isValid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(', ')}`
    );
  }
}
