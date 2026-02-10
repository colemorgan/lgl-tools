import { getToolBySlug } from '@/config/tools';
import { ToolPlaceholder } from '@/components/tools/tool-placeholder';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Prompter',
};

export default function PrompterPage() {
  const tool = getToolBySlug('prompter');

  if (!tool) {
    notFound();
  }

  return <ToolPlaceholder tool={tool} />;
}
