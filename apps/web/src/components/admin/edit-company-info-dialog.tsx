'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Workspace } from '@/types';

interface EditCompanyInfoDialogProps {
  workspace: Workspace;
  onUpdated: () => void;
}

export function EditCompanyInfoDialog({ workspace, onUpdated }: EditCompanyInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState(workspace.company_name ?? '');
  const [companyTaxId, setCompanyTaxId] = useState(workspace.company_tax_id ?? '');
  const [addressStreet, setAddressStreet] = useState(workspace.company_address_street ?? '');
  const [addressCity, setAddressCity] = useState(workspace.company_address_city ?? '');
  const [addressState, setAddressState] = useState(workspace.company_address_state ?? '');
  const [addressZip, setAddressZip] = useState(workspace.company_address_zip ?? '');
  const [addressCountry, setAddressCountry] = useState(workspace.company_address_country ?? '');
  const [primaryContactName, setPrimaryContactName] = useState(workspace.primary_contact_name ?? '');
  const [contactEmail, setContactEmail] = useState(workspace.contact_email ?? '');
  const [contactPhone, setContactPhone] = useState(workspace.contact_phone ?? '');
  const [saving, setSaving] = useState(false);

  function resetFields() {
    setCompanyName(workspace.company_name ?? '');
    setCompanyTaxId(workspace.company_tax_id ?? '');
    setAddressStreet(workspace.company_address_street ?? '');
    setAddressCity(workspace.company_address_city ?? '');
    setAddressState(workspace.company_address_state ?? '');
    setAddressZip(workspace.company_address_zip ?? '');
    setAddressCountry(workspace.company_address_country ?? '');
    setPrimaryContactName(workspace.primary_contact_name ?? '');
    setContactEmail(workspace.contact_email ?? '');
    setContactPhone(workspace.contact_phone ?? '');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName || null,
          company_tax_id: companyTaxId || null,
          company_address_street: addressStreet || null,
          company_address_city: addressCity || null,
          company_address_state: addressState || null,
          company_address_zip: addressZip || null,
          company_address_country: addressCountry || null,
          primary_contact_name: primaryContactName || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
        }),
      });

      if (res.ok) {
        setOpen(false);
        onUpdated();
      }
    } catch (error) {
      console.error('Failed to update company info:', error);
    }
    setSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetFields();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit Company Info</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-company-name">Company / Legal Name</Label>
            <Input
              id="edit-company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-tax-id">Tax ID / EIN</Label>
            <Input
              id="edit-tax-id"
              value={companyTaxId}
              onChange={(e) => setCompanyTaxId(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Billing Address</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-street">Street Address</Label>
                <Input
                  id="edit-street"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State / Province</Label>
                  <Input
                    id="edit-state"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-zip">ZIP / Postal Code</Label>
                  <Input
                    id="edit-zip"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Primary Contact</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-contact-name">Contact Name</Label>
                <Input
                  id="edit-contact-name"
                  value={primaryContactName}
                  onChange={(e) => setPrimaryContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-contact-email">Contact Email</Label>
                  <Input
                    id="edit-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact-phone">Contact Phone</Label>
                  <Input
                    id="edit-contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
