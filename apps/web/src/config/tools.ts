import { Clock, Scroll, Volume2, Radio, LucideIcon } from 'lucide-react';
import type { Tool } from '@/types';

export const toolIconMap: Record<string, LucideIcon> = {
  Clock,
  Scroll,
  Volume2,
  Radio,
};

export function getToolIcon(iconName: string): LucideIcon {
  return toolIconMap[iconName] || Clock;
}

/** @deprecated Use tools from DB (public.tools table) instead. Kept for landing page + icon mapping. */
export const tools: Tool[] = [
  {
    slug: 'live-stream',
    name: 'Backup Live Stream',
    description: 'Spin up a backup live stream with RTMP ingest and a hosted player page.',
    icon: 'Radio',
    status: 'available',
    metered: true,
  },
  {
    slug: 'timer',
    name: 'Timer',
    description: 'Keep every segment on schedule with precision countdowns and alerts.',
    icon: 'Clock',
    status: 'coming_soon',
  },
  {
    slug: 'prompter',
    name: 'Prompter',
    description: 'Feed scripts to talent smoothly so every line lands on cue.',
    icon: 'Scroll',
    status: 'coming_soon',
  },
  {
    slug: 'vog',
    name: 'VOG',
    description: 'Deliver polished voice-of-god announcements without a booth.',
    icon: 'Volume2',
    status: 'coming_soon',
  },
];

/** @deprecated Use DB lookup instead. Kept for backward compatibility. */
export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}
