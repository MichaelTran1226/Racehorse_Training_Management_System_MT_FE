import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Field } from '@/shared/components/form/Field';
import { Textarea } from '@/shared/components/form/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/useToast';
import { messageFor } from '@/shared/lib/messages';
import { tr } from '@/shared/i18n/tr';
import { assignShiftSlot } from '../api/shiftRosterApi';
import type {
  ApplyScope,
  GroomUserSummary,
  ShiftRosterItem,
} from '../types/shiftRoster';
import type { ShiftCatalogItem } from '@/features/master-data/types/supplies';
import type { Zone } from '../types';

interface ShiftRosterModalProps {
  date: string; // YYYY-MM-DD
  formattedDate: string; // dd/MM/yyyy
  shift: ShiftCatalogItem;
  zone: Zone;
  currentRosters: ShiftRosterItem[];
  allGrooms: GroomUserSummary[];
  groomWeeklyCounts: Record<string, number>;
  onClose: () => void;
  onSaved: () => void;
}

export function ShiftRosterModal({
  date,
  formattedDate,
  shift,
  zone,
  currentRosters,
  allGrooms,
  groomWeeklyCounts,
  onClose,
  onSaved,
}: ShiftRosterModalProps) {
  const toast = useToast();
  const initialGroomIds = currentRosters.map((r) => r.groomUserId);
  const [selectedGroomIds, setSelectedGroomIds] = useState<string[]>(initialGroomIds);
  const [applyScope, setApplyScope] = useState<ApplyScope>('ONLY_THIS_DAY');
  const [notes, setNotes] = useState<string>(currentRosters[0]?.notes ?? '');

  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleGroom = (id: string) => {
    setSelectedGroomIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((gId) => gId !== id);
      } else {
        if (prev.length >= 10) {
          toast.show(tr('Maximum 10 staff per shift.'), 'warn');
          return prev;
        }
        return [...prev, id];
      }
    });
    setDirty(true);
  };

  const handleClose = () => {
    if (!dirty || window.confirm(tr('Discard unsaved changes?'))) {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await assignShiftSlot({
        date,
        shiftId: shift.id,
        zoneId: zone.id,
        groomUserIds: selectedGroomIds,
        applyScope,
        notes: notes.trim() || undefined,
      });

      toast.show(tr('Shift assignment updated successfully.'), 'ok');
      onSaved();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tr('Assign Shift: {{zone}} – {{shift}}', { zone: zone.name, shift: shift.name })}
      onClose={handleClose}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>
            {tr('Duty Date:')} <strong>{formattedDate}</strong>
          </span>
          <Badge tone="brand">{tr('Time slot:')} {shift.startTime} - {shift.endTime}</Badge>
          {shift.isOvernight && <Badge tone="warn">{tr('Overnight Shift')}</Badge>}
        </div>

        <Field
          label={tr('Assigned Grooms ({{count}}/10)', { count: selectedGroomIds.length })}
          hint={tr('Select staff for this shift. Empty = unassigned.')}
        >
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {allGrooms.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
                {tr('No active groom staff found.')}
              </p>
            ) : (
              allGrooms.map((groom) => {
                const checked = selectedGroomIds.includes(groom.id);
                const shiftCount = groomWeeklyCounts[groom.id] || 0;
                return (
                  <label
                    key={groom.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--r-xs)',
                      background: checked ? 'var(--surface-muted)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroom(groom.id)}
                      />
                      <span style={{ fontWeight: checked ? 600 : 400 }}>{groom.fullName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        ({groom.email})
                      </span>
                    </div>
                    <Badge tone={shiftCount > 5 ? 'warn' : 'neutral'}>
                      {tr('{{count}} shifts/week', { count: shiftCount })}
                    </Badge>
                  </label>
                );
              })
            )}
          </div>
        </Field>

        <Field label={tr('Application Scope')} required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="applyScope"
                value="ONLY_THIS_DAY"
                checked={applyScope === 'ONLY_THIS_DAY'}
                onChange={() => {
                  setApplyScope('ONLY_THIS_DAY');
                  setDirty(true);
                }}
              />
              <span>{tr('Only this day ({{date}})', { date: formattedDate })}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="applyScope"
                value="REST_OF_WEEK"
                checked={applyScope === 'REST_OF_WEEK'}
                onChange={() => {
                  setApplyScope('REST_OF_WEEK');
                  setDirty(true);
                }}
              />
              <span>{tr('Rest of the week (until Sunday)')}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="applyScope"
                value="SAME_DAY_4_WEEKS"
                checked={applyScope === 'SAME_DAY_4_WEEKS'}
                onChange={() => {
                  setApplyScope('SAME_DAY_4_WEEKS');
                  setDirty(true);
                }}
              />
              <span>{tr('Same day of the week for next 4 weeks')}</span>
            </label>
          </div>
        </Field>

        <Field label={tr('Roster Notes')}>
          <Textarea
            rows={2}
            value={notes}
            placeholder={tr('Special tasks or handover notes...')}
            maxLength={300}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Button tone="secondary" type="button" onClick={handleClose}>
            {tr('Cancel')}
          </Button>
          <Button tone="primary" type="submit" disabled={busy}>
            {busy ? tr('Saving...') : tr('Save Roster (BTN-4.53)')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
