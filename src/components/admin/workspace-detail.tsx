'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToolToggles } from './tool-toggles';
import { InviteWorkspaceMemberDialog } from './invite-workspace-member-dialog';
import type { Workspace, WorkspaceMember, WorkspaceTool, ClientInvite } from '@/types';

interface MemberWithProfile extends WorkspaceMember {
  full_name: string | null;
  email: string | null;
}

interface WorkspaceDetail extends Workspace {
  billing_client_name: string | null;
  members: MemberWithProfile[];
  tools: WorkspaceTool[];
  invites: ClientInvite[];
}

export function WorkspaceDetailView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchWorkspace = useCallback(() => {
    fetch(`/api/admin/workspaces/${workspaceId}`)
      .then((res) => res.json())
      .then(setWorkspace)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspace((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setSaving(false);
  }

  async function handleVerifyCard() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/verify-card`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Failed to create verification link');
      }
    } catch (error) {
      console.error('Failed to verify card:', error);
    }
    setVerifying(false);
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!workspace) {
    return <div className="text-destructive">Workspace not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/workspaces')}>
        &larr; Back to Workspaces
      </Button>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>{workspace.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p>
                <Badge variant="outline">
                  {workspace.type === 'managed' ? 'Managed' : 'Self-Serve'}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Select
                  value={workspace.status}
                  onValueChange={updateStatus}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe Customer</label>
              <p className="font-mono text-sm">
                {workspace.stripe_customer_id || 'Not linked'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
              <div className="flex items-center gap-2">
                {workspace.stripe_payment_method_id ? (
                  <Badge variant="default">Card on file</Badge>
                ) : (
                  <>
                    <Badge variant="outline">Not saved</Badge>
                    {workspace.type === 'managed' && workspace.stripe_customer_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleVerifyCard}
                        disabled={verifying}
                      >
                        {verifying ? 'Creating...' : 'Verify Card'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {workspace.billing_client_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing Client</label>
                <p>{workspace.billing_client_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tool Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ToolToggles
            workspaceId={workspaceId}
            workspaceTools={workspace.tools}
            onUpdate={fetchWorkspace}
          />
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          <InviteWorkspaceMemberDialog
            workspaceId={workspaceId}
            onInvited={fetchWorkspace}
          />
        </CardHeader>
        <CardContent>
          {workspace.members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No members yet. Send an invite to add the first member.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name || '--'}
                    </TableCell>
                    <TableCell>{member.email || '--'}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {workspace.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email || 'Open invite'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.workspace_role || 'user'}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expires_at).toLocaleDateString()}
                      {new Date(invite.expires_at) < new Date() && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
