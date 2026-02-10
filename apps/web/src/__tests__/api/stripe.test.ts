// Mock Stripe before importing anything
const mockStripeInstance = {
  customers: { create: jest.fn(), retrieve: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

// Save original env
const originalEnv = process.env;

describe('Stripe utilities', () => {
  beforeEach(() => {
    // Reset module cache to test fresh initialization
    jest.resetModules();
    // Setup clean environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getStripe', () => {
    it('throws error when STRIPE_SECRET_KEY is not set', () => {
      delete process.env.STRIPE_SECRET_KEY;

      // Re-import to get fresh module
      const { getStripe: freshGetStripe } = require('@/lib/stripe');

      expect(() => freshGetStripe()).toThrow('STRIPE_SECRET_KEY is not set');
    });

    it('initializes Stripe client when key is provided', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      // Re-import to get fresh module
      const { getStripe: freshGetStripe } = require('@/lib/stripe');

      const stripe = freshGetStripe();
      expect(stripe).toBeDefined();
    });

    it('returns same instance on subsequent calls (singleton)', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      // Re-import to get fresh module
      const { getStripe: freshGetStripe } = require('@/lib/stripe');

      const stripe1 = freshGetStripe();
      const stripe2 = freshGetStripe();
      expect(stripe1).toBe(stripe2);
    });
  });

  describe('stripe proxy object', () => {
    it('provides access to customers API', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      const { stripe } = require('@/lib/stripe');

      expect(stripe.customers).toBeDefined();
    });

    it('provides access to checkout API', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      const { stripe } = require('@/lib/stripe');

      expect(stripe.checkout).toBeDefined();
    });

    it('provides access to billingPortal API', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      const { stripe } = require('@/lib/stripe');

      expect(stripe.billingPortal).toBeDefined();
    });

    it('provides access to webhooks API', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

      const { stripe } = require('@/lib/stripe');

      expect(stripe.webhooks).toBeDefined();
    });
  });
});
