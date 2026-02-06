import { Clock, Scroll, Volume2, LucideIcon } from 'lucide-react';
import type { Tool } from '@/types';

export const toolIconMap: Record<string, LucideIcon> = {
  Clock,
  Scroll,
  Volume2,
};

export function getToolIcon(iconName: string): LucideIcon {
  return toolIconMap[iconName] || Clock;
}

export const tools: Tool[] = [
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

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}
