import { getToolBySlug } from '@/config/tools';
import { ToolPlaceholder } from '@/components/tools/tool-placeholder';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Timer',
};

export default function TimerPage() {
  const tool = getToolBySlug('timer');

  if (!tool) {
    notFound();
  }

  return <ToolPlaceholder tool={tool} />;
}
