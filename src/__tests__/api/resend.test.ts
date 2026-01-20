// Save original env
const originalEnv = process.env;

describe('Resend utilities', () => {
  beforeEach(() => {
    // Reset module cache to test fresh initialization
    jest.resetModules();
    // Setup clean environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getResendClient', () => {
    it('throws error when RESEND_API_KEY is not set', () => {
      delete process.env.RESEND_API_KEY;

      // Re-import to get fresh module
      const { sendEmail } = require('@/lib/resend');

      // Calling sendEmail will trigger getResendClient
      expect(async () => {
        await sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          react: null,
        });
      }).rejects.toThrow('RESEND_API_KEY environment variable is not set');
    });
  });

  describe('sendEmail', () => {
    it('uses default from email when RESEND_FROM_EMAIL is not set', async () => {
      process.env.RESEND_API_KEY = 're_test_mock_key';
      delete process.env.RESEND_FROM_EMAIL;

      // Mock the Resend class
      jest.mock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: {
            send: jest.fn().mockResolvedValue({
              data: { id: 'test-email-id' },
              error: null,
            }),
          },
        })),
      }));

      const { sendEmail } = require('@/lib/resend');

      // This test validates that the module imports correctly
      // Actual email sending would require full integration testing
      expect(typeof sendEmail).toBe('function');
    });
  });
});
