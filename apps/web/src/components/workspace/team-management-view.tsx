'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { InviteClientMemberDialog } from './invite-client-member-dialog';
import type { WorkspaceMemberRole, ClientInvite } from '@/types';

interface MemberRow {
  id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

interface TeamData {
  members: MemberRow[];
  invites: ClientInvite[];
}

export function TeamManagementView() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/members');
      if (!res.ok) throw new Error('Failed to fetch team data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function handleRemove(userId: string) {
    if (!confirm('Remove this member from the workspace?')) return;

    setRemoving(userId);
    try {
      const res = await fetch(`/api/workspace/members?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTeam();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    }
    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          <InviteClientMemberDialog onInvited={fetchTeam} />
        </CardHeader>
        <CardContent>
          {!data?.members?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No members yet. Send an invite to add the first member.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || '--'}
                      </TableCell>
                      <TableCell>{member.email || '--'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === 'owner' ? 'default' : 'secondary'}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(member.user_id)}
                            disabled={removing === member.user_id}
                          >
                            {removing === member.user_id ? 'Removing...' : 'Remove'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {data?.invites && data.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email || 'Open invite'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invite.workspace_role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invite.expires_at).toLocaleDateString()}
                        {new Date(invite.expires_at) < new Date() && (
                          <Badge variant="destructive" className="ml-2">
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
