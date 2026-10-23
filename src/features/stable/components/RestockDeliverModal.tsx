import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Field } from '@/shared/components/form/Field';
import { Input } from '@/shared/components/form/Input';
import { Textarea } from '@/shared/components/form/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/Toast';
import { tr } from '@/shared/i18n/tr';
import { messageFor } from '@/shared/lib/messages';
import { inventoryApi } from '../api/inventoryApi';
import type { RestockRequestItem } from '../types/inventory';
import { formatSupplyUnit, formatSupplyName } from '@/features/master-data/types/supplies';

interface RestockDeliverModalProps {
  request: RestockRequestItem;
  onClose: () => void;
  onSaved: () => void;
}

export function RestockDeliverModal({ request, onClose, onSaved }: RestockDeliverModalProps) {
  const toast = useToast();
  const defaultQty = request.approvedQuantity ?? request.requestedQuantity;
  const [receivedQuantity, setReceivedQuantity] = useState(String(defaultQty));
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseFloat(receivedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError(tr('Received quantity must be greater than zero.'));
      return;
    }

    setBusy(true);
    try {
      await inventoryApi.deliverRequest(request.id, {
        receivedQuantity: qty,
        deliveryNotes: deliveryNotes.trim() || undefined,
      });

      toast.show(
        `${tr('Delivery confirmed! Automatically added')} +${qty} ${formatSupplyUnit(request.supply.unit)} ${tr('to')} ${request.zone.name}.`,
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
      title={tr('Confirm Warehouse Stock Receipt')}
      subtitle={`${request.requestNumber} · ${request.supply.name} (${request.zone.name})`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <Alert tone="danger">{error}</Alert>}

        <Alert tone="info">
          {tr('Confirming stock receipt will automatically increment the physical stock balance for this stall zone.')}
        </Alert>

        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--surface-sunken)',
            borderRadius: 'var(--r-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{tr('Proposal Number')}:</span>
            <strong>{request.requestNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{tr('Target Stall Zone')}:</span>
            <strong>{request.zone.name} ({request.zone.code})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{tr('Supply Item')}:</span>
            <strong>{formatSupplyName(request.supply.name)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{tr('Approved Quantity')}:</span>
            <Badge tone="ok">
              {defaultQty} {formatSupplyUnit(request.supply.unit)}
            </Badge>
          </div>
        </div>

        <Field
          label={`${tr('Actual Received Quantity')} (${formatSupplyUnit(request.supply.unit)})`}
          required
          hint={tr('Verified count delivered to the stall zone warehouse.')}
        >
          <Input
            type="number"
            step="any"
            min="0.1"
            value={receivedQuantity}
            onChange={(e) => setReceivedQuantity(e.target.value)}
            disabled={busy}
            required
          />
        </Field>

        <Field
          label={tr('Delivery Notes / Storage Location')}
          hint={tr('Optional notes on delivery person, invoice or shelf location.')}
        >
          <Textarea
            rows={2}
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder={tr('e.g. Delivered by supplier, placed in Zone A storage bin #2...')}
            disabled={busy}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" tone="secondary" onClick={onClose} disabled={busy}>
            {tr('Cancel')}
          </Button>
          <Button type="submit" tone="primary" disabled={busy}>
            {busy ? tr('Receiving...') : tr('Confirm Stock Delivery')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
