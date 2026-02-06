import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { HostedPlayer } from './hosted-player';

interface PageProps {
  params: Promise<{ streamId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { streamId } = await params;
  const supabase = createAdminClient();

  const { data: stream } = await supabase
    .from('live_streams')
    .select('name')
    .eq('id', streamId)
    .single();

  const title = stream?.name ?? 'Live Stream';

  return {
    title,
    description: `Watch ${title} live.`,
  };
}

export default async function LivePlayerPage({ params }: PageProps) {
  const { streamId } = await params;
  const supabase = createAdminClient();

  const { data: stream } = await supabase
    .from('live_streams')
    .select('id, name, cloudflare_live_input_id, hls_playback_url, status')
    .eq('id', streamId)
    .single();

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-semibold mb-2">
            Stream Not Found
          </h1>
          <p className="text-gray-400">
            This stream may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HostedPlayer
      streamName={stream.name}
      cloudflareId={stream.cloudflare_live_input_id}
    />
  );
}
