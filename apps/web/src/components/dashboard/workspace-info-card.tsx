import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkspaceMemberRole } from '@/types';

interface WorkspaceInfoCardProps {
  workspaceName: string;
  memberRole: WorkspaceMemberRole;
}

export function WorkspaceInfoCard({
  workspaceName,
  memberRole,
}: WorkspaceInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Workspace</CardTitle>
          <Badge variant={memberRole === 'owner' ? 'default' : 'secondary'}>
            {memberRole}
          </Badge>
        </div>
        <CardDescription>Your managed workspace information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Workspace
            </label>
            <p className="text-sm">{workspaceName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Role
            </label>
            <p className="text-sm capitalize">{memberRole}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
