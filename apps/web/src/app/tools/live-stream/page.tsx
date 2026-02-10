import { getToolBySlug } from '@/config/tools';
import { notFound } from 'next/navigation';
import { LiveStreamDashboard } from '@/components/tools/live-stream/live-stream-dashboard';

export const metadata = {
  title: 'Backup Live Stream',
};

export default function LiveStreamPage() {
  const tool = getToolBySlug('live-stream');

  if (!tool) {
    notFound();
  }

  return <LiveStreamDashboard />;
}
