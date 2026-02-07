/**
 * Cloudflare Stream API integration
 *
 * Handles live input creation, management, and usage analytics
 * via the Cloudflare Stream REST API.
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function getAccountId(): string {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!id) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  return id;
}

function getApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  return token;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    'Content-Type': 'application/json',
  };
}

// ── Types ────────────────────────────────────────────────────────────────

export interface CloudflareLiveInput {
  uid: string;
  meta: Record<string, string>;
  created: string;
  modified: string;
  rtmps: {
    url: string;
    streamKey: string;
  };
  rtmpsPlayback: {
    url: string;
    streamKey: string;
  };
  srt: {
    url: string;
    streamId: string;
    passphrase: string;
  };
  srtPlayback: {
    url: string;
    streamId: string;
    passphrase: string;
  };
  webRTC: {
    url: string;
  };
  webRTCPlayback: {
    url: string;
  };
  status: {
    current: string;
  } | null;
  recording?: {
    mode: string;
  };
}

interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

export interface StreamAnalyticsRow {
  minutesViewed: number;
}

// ── Live Input CRUD ──────────────────────────────────────────────────────

export async function createLiveInput(meta: Record<string, string>): Promise<CloudflareLiveInput> {
  const accountId = getAccountId();
  const res = await fetch(`${CF_API_BASE}/accounts/${accountId}/stream/live_inputs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      meta,
      recording: { mode: 'off' },
    }),
  });

  const data: CloudflareApiResponse<CloudflareLiveInput> = await res.json();

  if (!data.success) {
    const msg = data.errors.map((e) => e.message).join(', ');
    throw new Error(`Cloudflare API error: ${msg}`);
  }

  return data.result;
}

export async function getLiveInput(liveInputId: string): Promise<CloudflareLiveInput> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs/${liveInputId}`,
    { headers: headers() }
  );

  const data: CloudflareApiResponse<CloudflareLiveInput> = await res.json();

  if (!data.success) {
    const msg = data.errors.map((e) => e.message).join(', ');
    throw new Error(`Cloudflare API error: ${msg}`);
  }

  return data.result;
}

export async function deleteLiveInput(liveInputId: string): Promise<void> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs/${liveInputId}`,
    { method: 'DELETE', headers: headers() }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare delete failed: ${text}`);
  }
}

// ── Playback URLs ────────────────────────────────────────────────────────

export function getHlsPlaybackUrl(liveInputId: string): string {
  return `https://iframe.cloudflarestream.com/${liveInputId}/manifest/video.m3u8`;
}

// ── Usage Analytics (GraphQL) ────────────────────────────────────────────

/**
 * Fetches total minutes viewed for a specific live input over a date range.
 * Uses the Cloudflare Stream Analytics GraphQL API.
 */
export async function getStreamMinutesViewed(
  liveInputId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const accountId = getAccountId();

  const query = `
    query StreamAnalytics($accountId: String!, $liveInputId: String!, $start: Date!, $end: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          streamMinutesViewedAdaptiveGroups(
            filter: {
              date_geq: $start
              date_leq: $end
              uid: $liveInputId
            }
            limit: 1
          ) {
            sum {
              minutesViewed
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`${CF_API_BASE}/graphql`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      query,
      variables: {
        accountId,
        liveInputId,
        start: startDate,
        end: endDate,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare analytics HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.errors?.length) {
    const msg = data.errors.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`Cloudflare analytics GraphQL error: ${msg}`);
  }

  const groups =
    data?.data?.viewer?.accounts?.[0]?.streamMinutesViewedAdaptiveGroups ?? [];

  if (groups.length === 0) return 0;
  return groups[0].sum?.minutesViewed ?? 0;
}
