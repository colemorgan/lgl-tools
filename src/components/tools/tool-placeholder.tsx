import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getToolIcon } from '@/config/tools';
import type { Tool } from '@/types';

interface ToolPlaceholderProps {
  tool: Tool;
}

export function ToolPlaceholder({ tool }: ToolPlaceholderProps) {
  const Icon = getToolIcon(tool.icon);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Icon className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl">{tool.name}</CardTitle>
            {tool.status === 'coming_soon' && (
              <Badge variant="secondary">Coming Soon</Badge>
            )}
          </div>
          <CardDescription className="text-base mt-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {tool.status === 'coming_soon'
              ? "We're working hard to bring this tool to you. Stay tuned for updates!"
              : 'This tool is ready for use.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
