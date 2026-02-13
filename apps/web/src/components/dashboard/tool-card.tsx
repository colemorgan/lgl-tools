import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getToolIcon } from '@/config/tools';
import type { ToolRecord } from '@/types';

interface ToolCardProps {
  tool: ToolRecord;
  hasAccess: boolean;
}

export function ToolCard({ tool, hasAccess }: ToolCardProps) {
  const Icon = getToolIcon(tool.icon);
  const isDisabled = !hasAccess;

  const cardContent = (
    <Card
      className={cn(
        'transition-all h-full',
        isDisabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-md hover:border-primary/50 cursor-pointer'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                isDisabled ? 'bg-muted' : 'bg-primary/10'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6',
                  isDisabled ? 'text-muted-foreground' : 'text-primary'
                )}
              />
            </div>
            <CardTitle className="text-lg">{tool.name}</CardTitle>
          </div>
          {tool.tool_type === 'metered' && !hasAccess && (
            <Badge variant="default" className="text-xs">
              Pro
            </Badge>
          )}
          {tool.tool_type === 'metered' && hasAccess && (
            <Badge variant="secondary" className="text-xs">
              Metered
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">
          {tool.description}
        </CardDescription>
      </CardContent>
    </Card>
  );

  if (isDisabled) {
    return cardContent;
  }

  return (
    <Link href={tool.route_path || `/tools/${tool.slug}`} target="_blank" rel="noopener">
      {cardContent}
    </Link>
  );
}
