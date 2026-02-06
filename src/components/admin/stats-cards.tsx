'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  trialing: number;
  expiredTrials: number;
  billingClients: number;
  pendingCharges: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Users', value: stats?.totalUsers },
    { title: 'Active Subscribers', value: stats?.activeSubscribers },
    { title: 'Trialing', value: stats?.trialing },
    { title: 'Expired Trials', value: stats?.expiredTrials },
    { title: 'Billing Clients', value: stats?.billingClients },
    { title: 'Pending Charges', value: stats?.pendingCharges },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : (card.value ?? 0)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
