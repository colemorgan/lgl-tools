// Save original env
const originalEnv = process.env;

describe('Environment validation', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('returns isValid: true when all required vars are set', () => {
      // Set all required env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      process.env.STRIPE_SECRET_KEY = 'sk_test_key';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_key';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_key';
      process.env.STRIPE_PRICE_ID = 'price_123';
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.CRON_SECRET = 'cron-secret';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'cf-account-id';
      process.env.CLOUDFLARE_API_TOKEN = 'cf-api-token';
      process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN = 'cf-subdomain';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { validateEnv } = require('@/lib/env');
      const result = validateEnv();

      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns missing vars when required vars are not set', () => {
      // Clear all env vars
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_PRICE_ID;
      delete process.env.RESEND_API_KEY;
      delete process.env.CRON_SECRET;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { validateEnv } = require('@/lib/env');
      const result = validateEnv();

      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(result.missing).toContain('STRIPE_SECRET_KEY');
    });

    it('returns warning when RESEND_FROM_EMAIL is not set', () => {
      // Set all required env vars but not RESEND_FROM_EMAIL
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      process.env.STRIPE_SECRET_KEY = 'sk_test_key';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_key';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_key';
      process.env.STRIPE_PRICE_ID = 'price_123';
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.CRON_SECRET = 'cron-secret';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'cf-account-id';
      process.env.CLOUDFLARE_API_TOKEN = 'cf-api-token';
      process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN = 'cf-subdomain';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      delete process.env.RESEND_FROM_EMAIL;

      const { validateEnv } = require('@/lib/env');
      const result = validateEnv();

      expect(result.warnings).toContain(
        'RESEND_FROM_EMAIL not set, using default email'
      );
    });
  });

  describe('getEnvVar', () => {
    it('returns value when env var is set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { getEnvVar } = require('@/lib/env');
      const value = getEnvVar('NEXT_PUBLIC_APP_URL');

      expect(value).toBe('http://localhost:3000');
    });

    it('throws when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { getEnvVar } = require('@/lib/env');

      expect(() => getEnvVar('NEXT_PUBLIC_APP_URL')).toThrow(
        'Environment variable NEXT_PUBLIC_APP_URL is not set'
      );
    });
  });

  describe('requireEnv', () => {
    it('throws when required vars are missing', () => {
      // Clear all env vars
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const { requireEnv } = require('@/lib/env');

      expect(() => requireEnv()).toThrow('Missing required environment variables');
    });

    it('does not throw when all required vars are set', () => {
      // Set all required env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      process.env.STRIPE_SECRET_KEY = 'sk_test_key';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_key';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_key';
      process.env.STRIPE_PRICE_ID = 'price_123';
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.CRON_SECRET = 'cron-secret';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'cf-account-id';
      process.env.CLOUDFLARE_API_TOKEN = 'cf-api-token';
      process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN = 'cf-subdomain';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { requireEnv } = require('@/lib/env');

      expect(() => requireEnv()).not.toThrow();
    });
  });
});
