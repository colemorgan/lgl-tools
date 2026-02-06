'use client';

import { Badge } from '@/components/ui/badge';
import type { ChargeStatus } from '@/types';

const statusConfig: Record<ChargeStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  pending: { variant: 'outline', label: 'Pending' },
  processing: { variant: 'secondary', label: 'Processing' },
  succeeded: { variant: 'default', label: 'Succeeded' },
  failed: { variant: 'destructive', label: 'Failed' },
  canceled: { variant: 'outline', label: 'Canceled' },
};

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  const config = statusConfig[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
