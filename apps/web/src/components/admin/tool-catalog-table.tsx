'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ToolRecord } from '@/types';

const typeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  standard: 'default',
  metered: 'secondary',
  external: 'outline',
};

export function ToolCatalogTable() {
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/tools')
      .then((res) => res.json())
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Advertised</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Tier Access</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : tools.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No tools configured
              </TableCell>
            </TableRow>
          ) : (
            tools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell className="font-medium">{tool.name}</TableCell>
                <TableCell className="text-muted-foreground">{tool.category}</TableCell>
                <TableCell>
                  <Badge variant={typeVariant[tool.tool_type] ?? 'outline'}>
                    {tool.tool_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tool.is_advertised ? 'default' : 'outline'}>
                    {tool.is_advertised ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tool.is_enabled ? 'default' : 'destructive'}>
                    {tool.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {tool.tier_access.map((tier) => (
                      <Badge key={tier} variant="outline" className="text-xs">
                        {tier}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{tool.sort_order}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/tools/${tool.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
