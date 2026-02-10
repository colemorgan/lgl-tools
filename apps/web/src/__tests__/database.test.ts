import {
  getTrialDaysRemaining,
  hasActiveAccess,
  type Profile,
  type SubscriptionStatus,
} from '@/types/database';

describe('getTrialDaysRemaining', () => {
  it('returns positive days when trial is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = getTrialDaysRemaining(futureDate.toISOString());
    expect(result).toBe(10);
  });

  it('returns negative days when trial has passed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = getTrialDaysRemaining(pastDate.toISOString());
    expect(result).toBeLessThanOrEqual(-4);
  });

  it('returns 0 or 1 when trial ends today', () => {
    const today = new Date();
    const result = getTrialDaysRemaining(today.toISOString());
    expect(result).toBeLessThanOrEqual(1);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('hasActiveAccess', () => {
  const createProfile = (
    status: SubscriptionStatus,
    trialDaysFromNow: number = 15
  ): Profile => {
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + trialDaysFromNow);

    return {
      id: 'test-id',
      full_name: 'Test User',
      subscription_status: status,
      trial_ends_at: trialEnds.toISOString(),
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  it('returns false for null profile', () => {
    expect(hasActiveAccess(null)).toBe(false);
  });

  it('returns true for active subscription', () => {
    const profile = createProfile('active');
    expect(hasActiveAccess(profile)).toBe(true);
  });

  it('returns true for trialing with days remaining', () => {
    const profile = createProfile('trialing', 10);
    expect(hasActiveAccess(profile)).toBe(true);
  });

  it('returns false for trialing with no days remaining', () => {
    const profile = createProfile('trialing', -1);
    expect(hasActiveAccess(profile)).toBe(false);
  });

  it('returns false for past_due status', () => {
    const profile = createProfile('past_due');
    expect(hasActiveAccess(profile)).toBe(false);
  });

  it('returns false for canceled status', () => {
    const profile = createProfile('canceled');
    expect(hasActiveAccess(profile)).toBe(false);
  });

  it('returns false for expired_trial status', () => {
    const profile = createProfile('expired_trial');
    expect(hasActiveAccess(profile)).toBe(false);
  });
});
