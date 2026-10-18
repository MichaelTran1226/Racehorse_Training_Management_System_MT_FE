import { useMemo, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Field } from '@/shared/components/form/Field';
import { Input } from '@/shared/components/form/Input';
import { Select } from '@/shared/components/form/Select';
import { Textarea } from '@/shared/components/form/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { useToast } from '@/shared/components/ui/Toast';
import { tr } from '@/shared/i18n/tr';
import { messageFor } from '@/shared/lib/messages';
import { inventoryApi } from '../api/inventoryApi';

interface RestockRequestModalProps {
  zones: Array<{ id: string; name: string; code: string }>;
  supplies: Array<{ id: string; name: string; code: string; unit: string; category?: string }>;
  defaultZoneId?: string;
  defaultSupplyId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function RestockRequestModal({
  zones,
  supplies,
  defaultZoneId,
  defaultSupplyId,
  onClose,
  onSaved,
}: RestockRequestModalProps) {
  const toast = useToast();
  const [zoneId, setZoneId] = useState(defaultZoneId || (zones[0]?.id ?? ''));
  const [supplyId, setSupplyId] = useState(defaultSupplyId || (supplies[0]?.id ?? ''));
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedSupply = useMemo(
    () => supplies.find((s) => s.id === supplyId),
    [supplies, supplyId],
  );

  const zoneOptions = useMemo(
    () => zones.map((z) => ({ value: z.id, label: `${z.code} - ${z.name}` })),
    [zones],
  );

  const supplyOptions = useMemo(
    () => supplies.map((s) => ({ value: s.id, label: `${s.code} - ${s.name} (${s.unit})` })),
    [supplies],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseFloat(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError(tr('Requested quantity must be greater than zero.'));
      return;
    }

    if (!urgencyReason.trim()) {
      setError(tr('Please enter the urgency reason for this restock proposal.'));
      return;
    }

    setBusy(true);
    try {
      await inventoryApi.createRequest({
        zoneId,
        supplyId,
        requestedQuantity: qty,
        urgencyReason: urgencyReason.trim(),
      });
      toast.show(
        tr('Restock proposal submitted successfully. Notification sent to Club Manager.'),
        'ok',
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tr('Propose Supply Restock')}
      subtitle={tr('Submit replenishment proposal for stable staff and veterinarians.')}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <Alert tone="danger">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Field label={tr('Target Stall Zone')} required>
            <Select
              options={zoneOptions}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label={tr('Supply Item')} required>
            <Select
              options={supplyOptions}
              value={supplyId}
              onChange={(e) => setSupplyId(e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>

        <Field
          label={`${tr('Requested Quantity')} (${selectedSupply?.unit || 'unit'})`}
          required
          hint={tr('Number of units required for this stall zone.')}
        >
          <Input
            type="number"
            step="any"
            min="0.1"
            value={requestedQuantity}
            onChange={(e) => setRequestedQuantity(e.target.value)}
            placeholder="e.g. 25"
            disabled={busy}
            required
          />
        </Field>

        <Field
          label={tr('Urgency Reason & Operational Justification')}
          required
          hint={tr('Detail why this restock is urgent (e.g. Running out of feed before tomorrow morning, critical medication).')}
        >
          <Textarea
            rows={3}
            value={urgencyReason}
            onChange={(e) => setUrgencyReason(e.target.value)}
            placeholder={tr('Describe urgency, anticipated shortage, or immediate needs...')}
            disabled={busy}
            required
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" tone="secondary" onClick={onClose} disabled={busy}>
            {tr('Cancel')}
          </Button>
          <Button type="submit" tone="primary" disabled={busy}>
            {busy ? tr('Submitting...') : tr('Submit Restock Proposal')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
