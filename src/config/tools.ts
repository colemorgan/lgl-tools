import type { Tool } from '@/types';

export const tools: Tool[] = [
  {
    slug: 'timer',
    name: 'Timer',
    description: 'A simple and elegant timer for tracking time spent on tasks.',
    icon: 'Clock',
    status: 'coming_soon',
  },
  {
    slug: 'prompter',
    name: 'Prompter',
    description: 'A teleprompter tool for presentations and video recordings.',
    icon: 'Scroll',
    status: 'coming_soon',
  },
  {
    slug: 'vog',
    name: 'VOG',
    description: 'Voice of God - A text-to-speech tool for announcements.',
    icon: 'Volume2',
    status: 'coming_soon',
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}
