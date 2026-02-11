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
import { AddExistingMemberDialog } from './add-existing-member-dialog';
import { ChargesTable } from './charges-table';
import { AddChargeDialog } from './add-charge-dialog';
import { EditCompanyInfoDialog } from './edit-company-info-dialog';
import type { Workspace, WorkspaceMember, WorkspaceTool, ClientInvite, ScheduledCharge } from '@/types';

interface MemberWithProfile extends WorkspaceMember {
  full_name: string | null;
  email: string | null;
}

interface WorkspaceDetail extends Workspace {
  billing_user_email: string | null;
  members: MemberWithProfile[];
  tools: WorkspaceTool[];
  invites: ClientInvite[];
  charges: ScheduledCharge[];
}

export function WorkspaceDetailView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

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

  async function generatePaymentLink() {
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/send-payment-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        alert('Payment link copied to clipboard!');
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Failed to generate payment link:', error);
    }
    setGeneratingLink(false);
  }

  async function triggerCharge(chargeId: string) {
    if (!confirm('Charge the client now?')) return;
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/charges/${chargeId}/trigger`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchWorkspace();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger charge');
      }
    } catch (error) {
      console.error('Failed to trigger charge:', error);
    }
  }

  async function cancelCharge(chargeId: string) {
    if (!confirm('Cancel this charge?')) return;
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/charges/${chargeId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchWorkspace();
      }
    } catch (error) {
      console.error('Failed to cancel charge:', error);
    }
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
              <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
              <div className="flex items-center gap-2">
                {workspace.stripe_payment_method_id ? (
                  <Badge variant="default">Card on file</Badge>
                ) : (
                  <>
                    <Badge variant="outline">Not saved</Badge>
                    {workspace.stripe_customer_id && (
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
            {workspace.billing_user_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing User</label>
                <p>{workspace.billing_user_email}</p>
              </div>
            )}
            {workspace.contact_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                <p>{workspace.contact_email}</p>
              </div>
            )}
            {workspace.contact_phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                <p>{workspace.contact_phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe Customer</label>
              <p className="font-mono text-sm">
                {workspace.stripe_customer_id || 'Not linked'}
              </p>
            </div>
            {workspace.notes && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm">{workspace.notes}</p>
              </div>
            )}
          </div>

          {/* Company Information */}
          {workspace.type === 'managed' && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Company Information</h4>
                <EditCompanyInfoDialog workspace={workspace} onUpdated={fetchWorkspace} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-sm">{workspace.company_name || '--'}</p>
                </div>
                {workspace.company_tax_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax ID / EIN</label>
                    <p className="text-sm">{workspace.company_tax_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                  <p className="text-sm">{workspace.primary_contact_name || '--'}</p>
                </div>
                {(workspace.company_address_street || workspace.company_address_city || workspace.company_address_state || workspace.company_address_zip || workspace.company_address_country) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Billing Address</label>
                    <p className="text-sm">
                      {[
                        workspace.company_address_street,
                        [workspace.company_address_city, workspace.company_address_state].filter(Boolean).join(', '),
                        workspace.company_address_zip,
                        workspace.company_address_country,
                      ]
                        .filter(Boolean)
                        .join('\n')
                        .split('\n')
                        .map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {workspace.billing_client_id && (
            <div className="flex gap-4 pt-4">
              <Button
                onClick={generatePaymentLink}
                disabled={generatingLink}
                variant="outline"
              >
                {generatingLink ? 'Generating...' : 'Generate Payment Link'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Charges */}
      {workspace.billing_client_id && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Scheduled Charges</CardTitle>
            <AddChargeDialog workspaceId={workspaceId} onCreated={fetchWorkspace} />
          </CardHeader>
          <CardContent>
            <ChargesTable
              charges={workspace.charges}
              onTrigger={triggerCharge}
              onCancel={cancelCharge}
            />
          </CardContent>
        </Card>
      )}

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
          <div className="flex gap-2">
            <AddExistingMemberDialog
              workspaceId={workspaceId}
              onAdded={fetchWorkspace}
            />
            <InviteWorkspaceMemberDialog
              workspaceId={workspaceId}
              onInvited={fetchWorkspace}
            />
          </div>
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
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
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
