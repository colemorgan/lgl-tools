export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired_trial';

export type UserRole = 'user' | 'admin';

export type BillingClientStatus = 'pending_setup' | 'active' | 'paused' | 'closed';

export type ChargeStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface Profile {
  id: string;
  full_name: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BillingClient {
  id: string;
  user_id: string | null;
  name: string;
  notes: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  status: BillingClientStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientInvite {
  id: string;
  billing_client_id: string;
  token: string;
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledCharge {
  id: string;
  billing_client_id: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  scheduled_date: string;
  status: ChargeStatus;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkspaceType = 'self_serve' | 'managed';

export type WorkspaceStatus = 'active' | 'suspended' | 'closed';

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  billing_client_id: string | null;
  status: WorkspaceStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  created_at: string;
}

export interface WorkspaceTool {
  id: string;
  workspace_id: string;
  tool_id: string;
  enabled: boolean;
  created_at: string;
}

export type LiveStreamStatus = 'created' | 'connected' | 'disconnected';

export interface LiveStream {
  id: string;
  user_id: string;
  billing_client_id: string | null;
  cloudflare_live_input_id: string;
  name: string;
  rtmp_url: string;
  rtmp_stream_key: string;
  hls_playback_url: string;
  status: LiveStreamStatus;
  created_at: string;
  updated_at: string;
}

export interface StreamUsageRecord {
  id: string;
  live_stream_id: string;
  billing_client_id: string | null;
  minutes_watched: number;
  recorded_at: string;
  cost_delivery_cents: number;
  billable_amount_cents: number;
  created_at: string;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}

export function getTrialDaysRemaining(trialEndsAt: string): number {
  const trialEnds = new Date(trialEndsAt);
  const now = new Date();
  return Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function hasActiveAccess(profile: Profile | null): boolean {
  if (!profile) return false;

  const status = profile.subscription_status;

  if (status === 'active') return true;

  if (status === 'trialing') {
    return getTrialDaysRemaining(profile.trial_ends_at) > 0;
  }

  return false;
}
