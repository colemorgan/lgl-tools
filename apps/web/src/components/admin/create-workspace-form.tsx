'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getToolIcon } from '@/config/tools';
import type { ToolRecord } from '@/types';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [dbTools, setDbTools] = useState<ToolRecord[]>([]);
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/tools')
      .then((res) => res.json())
      .then((tools: ToolRecord[]) => {
        setDbTools(tools);
        const initial: Record<string, boolean> = {};
        tools.forEach((tool) => {
          initial[tool.slug] = tool.is_enabled;
        });
        setEnabledTools(initial);
      })
      .catch(console.error);
  }, []);

  function toggleTool(slug: string) {
    setEnabledTools((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  const canSubmit = name && companyName && primaryContactName && contactEmail;

  async function handleCreate() {
    if (!canSubmit) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company_name: companyName,
          company_tax_id: companyTaxId || null,
          company_address_street: addressStreet || null,
          company_address_city: addressCity || null,
          company_address_state: addressState || null,
          company_address_zip: addressZip || null,
          company_address_country: addressCountry || null,
          primary_contact_name: primaryContactName,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          notes: notes || null,
          tools: enabledTools,
        }),
      });

      if (res.ok) {
        const workspace = await res.json();
        router.push(`/admin/workspaces/${workspace.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create workspace');
      }
    } catch {
      setError('Failed to create workspace');
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-8">
        {/* Workspace Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Workspace Details</h3>
          <div className="space-y-2">
            <Label htmlFor="ws-name">Workspace Name *</Label>
            <Input
              id="ws-name"
              placeholder="Acme Productions"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
          <div className="space-y-2">
            <Label htmlFor="ws-company-name">Company / Legal Name *</Label>
            <Input
              id="ws-company-name"
              placeholder="Acme Productions LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-tax-id">Tax ID / EIN</Label>
            <Input
              id="ws-tax-id"
              placeholder="12-3456789"
              value={companyTaxId}
              onChange={(e) => setCompanyTaxId(e.target.value)}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Billing Address</h3>
            <p className="text-xs text-muted-foreground">Recommended for invoicing</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-street">Street Address</Label>
            <Input
              id="ws-street"
              placeholder="123 Main St, Suite 100"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws-city">City</Label>
              <Input
                id="ws-city"
                placeholder="New York"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-state">State / Province</Label>
              <Input
                id="ws-state"
                placeholder="NY"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws-zip">ZIP / Postal Code</Label>
              <Input
                id="ws-zip"
                placeholder="10001"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-country">Country</Label>
              <Input
                id="ws-country"
                placeholder="US"
                value={addressCountry}
                onChange={(e) => setAddressCountry(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Primary Contact</h3>
          <div className="space-y-2">
            <Label htmlFor="ws-contact-name">Contact Name *</Label>
            <Input
              id="ws-contact-name"
              placeholder="Jane Doe"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws-email">Contact Email *</Label>
              <Input
                id="ws-email"
                type="email"
                placeholder="billing@acme.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-phone">Contact Phone</Label>
              <Input
                id="ws-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="ws-notes">Notes</Label>
          <Textarea
            id="ws-notes"
            placeholder="Custom billing arrangement details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Enabled Tools */}
        <div className="space-y-3">
          <Label>Enabled Tools</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {dbTools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <label
                  key={tool.slug}
                  className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={enabledTools[tool.slug] ?? false}
                    onCheckedChange={() => toggleTool(tool.slug)}
                  />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{tool.name}</span>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-4">
          <Button onClick={handleCreate} disabled={saving || !canSubmit}>
            {saving ? 'Creating...' : 'Create Workspace'}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/workspaces')}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
