import { getToolBySlug } from '@/config/tools';
import { ToolPlaceholder } from '@/components/tools/tool-placeholder';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'VOG',
};

export default function VOGPage() {
  const tool = getToolBySlug('vog');

  if (!tool) {
    notFound();
  }

  return <ToolPlaceholder tool={tool} />;
}
