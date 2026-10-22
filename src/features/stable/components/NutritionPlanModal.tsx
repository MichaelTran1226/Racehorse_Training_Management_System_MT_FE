import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Field } from '@/shared/components/form/Field';
import { Input } from '@/shared/components/form/Input';
import { Select } from '@/shared/components/form/Select';
import { Textarea } from '@/shared/components/form/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert } from '@/shared/components/ui/Alert';
import { useToast } from '@/shared/components/ui/useToast';
import { tr } from '@/shared/i18n/tr';
import { messageFor } from '@/shared/lib/messages';
import { nutritionApi } from '../api/nutritionApi';
import { getSupplies } from '@/features/master-data/api/suppliesApi';
import { getHorses } from '@/features/horses/api';
import type { Meal, MealItem, NutritionPlan } from '../types/nutrition';
import type { SupplyCatalogItem } from '@/features/master-data/types/supplies';
import type { Horse } from '@/features/horses/types';

interface NutritionPlanModalProps {
  plan?: NutritionPlan | null;
  initialHorseId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_MEALS: Meal[] = [
  {
    mealType: 'MORNING',
    time: '06:00',
    items: [],
  },
  {
    mealType: 'NOON',
    time: '11:30',
    items: [],
  },
  {
    mealType: 'EVENING',
    time: '17:00',
    items: [],
  },
];

export function NutritionPlanModal({
  plan,
  initialHorseId,
  onClose,
  onSaved,
}: NutritionPlanModalProps) {
  const toast = useToast();
  const isEditing = Boolean(plan);

  const [horseId, setHorseId] = useState<string>(plan?.horseId || initialHorseId || '');
  const [meals, setMeals] = useState<Meal[]>(
    plan?.mealsJson && plan.mealsJson.length > 0
      ? JSON.parse(JSON.stringify(plan.mealsJson))
      : JSON.parse(JSON.stringify(DEFAULT_MEALS)),
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    plan?.specialInstructions || '',
  );

  const [horses, setHorses] = useState<Horse[]>([]);
  const [supplies, setSupplies] = useState<SupplyCatalogItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Tải danh sách ngựa và danh mục vật tư thức ăn
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [horsesRes, suppliesRes] = await Promise.all([
          getHorses({ limit: 100 }).catch(() => ({ items: [] as Horse[] })),
          getSupplies().catch(() => []),
        ]);
        if (!active) return;
        const horseList = Array.isArray(horsesRes) ? horsesRes : horsesRes.items || [];
        setHorses(horseList);
        setSupplies(suppliesRes.filter((s) => s.isActive));
        if (!horseId && horseList.length > 0) {
          setHorseId(horseList[0].id);
        }
      } catch (err) {
        if (active) setError(messageFor(err));
      } finally {
        if (active) setLoadingInitial(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const horseWeightKg = 500; // Khối lượng ngựa chuẩn hoặc theo hồ sơ

  // Tính toán trực tiếp tổng kg thức ăn và tỉ lệ %
  const { totalKg, ratioPct, evaluation } = useMemo(() => {
    let total = 0;
    for (const m of meals) {
      for (const it of m.items) {
        const u = (it.unit || '').toUpperCase();
        if (u === 'KG') total += Number(it.amount) || 0;
        else if (u === 'G') total += (Number(it.amount) || 0) / 1000;
        else if (u === 'LITER') total += Number(it.amount) || 0;
        else if (u === 'ML') total += (Number(it.amount) || 0) / 1000;
      }
    }
    const tKg = Math.round(total * 100) / 100;
    const rPct = Math.round((tKg / horseWeightKg) * 1000) / 10;
    let evalStatus: 'OPTIMAL' | 'UNDER' | 'OVER' = 'OPTIMAL';
    if (rPct < 1.5) evalStatus = 'UNDER';
    else if (rPct > 3.0) evalStatus = 'OVER';
    return { totalKg: tKg, ratioPct: rPct, evaluation: evalStatus };
  }, [meals, horseWeightKg]);

  const handleAddItem = (mealIndex: number) => {
    const defaultSupply = supplies[0];
    const newItem: MealItem = {
      supplyId: defaultSupply ? defaultSupply.id : '',
      supplyCode: defaultSupply ? defaultSupply.code : '',
      supplyName: defaultSupply ? defaultSupply.name : '',
      category: defaultSupply ? defaultSupply.category : 'FEED_HAY',
      amount: 1,
      unit: defaultSupply ? defaultSupply.unit : 'KG',
      notes: '',
    };
    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex] = {
        ...copy[mealIndex],
        items: [...copy[mealIndex].items, newItem],
      };
      return copy;
    });
  };

  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex] = {
        ...copy[mealIndex],
        items: copy[mealIndex].items.filter((_, idx) => idx !== itemIndex),
      };
      return copy;
    });
  };

  const handleItemChange = (
    mealIndex: number,
    itemIndex: number,
    field: keyof MealItem,
    value: any,
  ) => {
    setMeals((prev) => {
      const copy = [...prev];
      const items = [...copy[mealIndex].items];
      if (field === 'supplyId') {
        const found = supplies.find((s) => s.id === value);
        items[itemIndex] = {
          ...items[itemIndex],
          supplyId: value,
          supplyCode: found ? found.code : items[itemIndex].supplyCode,
          supplyName: found ? found.name : items[itemIndex].supplyName,
          category: found ? found.category : items[itemIndex].category,
          unit: found ? found.unit : items[itemIndex].unit,
        };
      } else {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      copy[mealIndex] = { ...copy[mealIndex], items };
      return copy;
    });
  };

  const handleMealTimeChange = (mealIndex: number, timeVal: string) => {
    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex] = { ...copy[mealIndex], time: timeVal };
      return copy;
    });
  };

  const handleSave = async (submitImmediately: boolean) => {
    if (!horseId) {
      setError(tr('Please select a horse.'));
      return;
    }
    const hasItems = meals.some((m) => m.items.length > 0);
    if (!hasItems) {
      setError(tr('Please add at least one item to the meal ration.'));
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (isEditing && plan) {
        await nutritionApi.update(plan.id, {
          meals,
          specialInstructions: specialInstructions.trim(),
        });
        if (submitImmediately) {
          await nutritionApi.submitForApproval(plan.id);
        }
        toast.show(
          submitImmediately
            ? tr('Nutrition plan updated and submitted for approval.')
            : tr('Nutrition plan draft updated successfully.'),
          'ok',
        );
      } else {
        await nutritionApi.create({
          horseId,
          meals,
          specialInstructions: specialInstructions.trim(),
          submitImmediately,
        });
        toast.show(
          submitImmediately
            ? tr('Nutrition plan submitted for veterinarian approval.')
            : tr('Nutrition plan draft saved successfully.'),
          'ok',
        );
      }
      onSaved();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const mealLabels: Record<string, { label: string }> = {
    MORNING: { label: tr('Morning Meal') },
    NOON: { label: tr('Noon Meal') },
    EVENING: { label: tr('Evening Meal') },
  };

  const horseOptions = useMemo(
    () =>
      horses.map((h) => ({
        value: h.id,
        label: `${h.name} (${h.horseCode || h.id.slice(0, 6)}) — ${h.stallCode || tr('No stall')}`,
      })),
    [horses],
  );

  const supplyOptions = useMemo(
    () =>
      supplies.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [supplies],
  );

  return (
    <Modal
      title={
        isEditing
          ? `${tr('Edit Nutrition Plan')} #${plan?.planCode || ''}`
          : tr('New Nutrition Plan')
      }
      onClose={onClose}
      width={780}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <Alert tone="danger">{error}</Alert>}

        {/* Section 1: Chọn ngựa */}
        <div
          style={{
            background: 'var(--color-surface-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label={tr('Target Horse')}>
              <Select
                options={horseOptions}
                value={horseId}
                onChange={(e) => setHorseId(e.target.value)}
                disabled={isEditing || loadingInitial}
              />
            </Field>

            <Field label={tr('Horse Weight Snapshot')}>
              <Input
                type="text"
                readOnly
                value={`${horseWeightKg} kg (${tr('Standard baseline')})`}
                style={{ background: 'var(--color-surface)', cursor: 'not-allowed' }}
              />
            </Field>
          </div>
        </div>

        {/* Section 2: Widget tính toán định lượng khoa học trực tiếp */}
        <div
          style={{
            background:
              evaluation === 'OPTIMAL'
                ? 'rgba(16, 185, 129, 0.08)'
                : evaluation === 'UNDER'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
            border:
              evaluation === 'OPTIMAL'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : evaluation === 'UNDER'
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {tr('Scientific Feeding Ratio')}
              </span>
              <Badge
                tone={
                  evaluation === 'OPTIMAL' ? 'ok' : evaluation === 'UNDER' ? 'warn' : 'danger'
                }
              >
                {evaluation === 'OPTIMAL'
                  ? tr('Optimal: 1.5% - 3.0%')
                  : evaluation === 'UNDER'
                  ? tr('Under 1.5% Body Weight')
                  : tr('Exceeds 3.0% Body Weight')}
              </Badge>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {totalKg} kg
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                ({ratioPct}% {tr('of body weight')})
              </span>
            </div>
          </div>

          {/* Progress Bar visual indicator */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--color-border)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (ratioPct / 4.0) * 100)}%`,
                height: '100%',
                background:
                  evaluation === 'OPTIMAL'
                    ? '#10B981'
                    : evaluation === 'UNDER'
                    ? '#F59E0B'
                    : '#EF4444',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          </div>

          {evaluation === 'UNDER' && (
            <span style={{ fontSize: '0.8rem', color: '#D97706' }}>
              {tr('Feed ration is below 1.5% of body weight. The horse may experience caloric deficit.')}
            </span>
          )}
          {evaluation === 'OVER' && (
            <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>
              {tr('Feed ration exceeds 3.0% of body weight. Colic and digestive overload risk.')}
            </span>
          )}
        </div>

        {/* Section 3: Danh sách 3 bữa ăn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {meals.map((meal, mIdx) => (
            <div
              key={meal.mealType}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/* Meal Header */}
              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  padding: '0.625rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.925rem' }}>
                    {mealLabels[meal.mealType]?.label}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {tr('Time:')}
                  </span>
                  <Input
                    type="time"
                    value={meal.time || ''}
                    onChange={(e) => handleMealTimeChange(mIdx, e.target.value)}
                    style={{ width: '105px', padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                  />
                  <Button
                    size="sm"
                    tone="ghost"
                    onClick={() => handleAddItem(mIdx)}
                    style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}
                  >
                    + {tr('Add Item')}
                  </Button>
                </div>
              </div>

              {/* Meal Items List */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {meal.items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                    }}
                  >
                    {tr('No feed items added for this meal.')}
                  </div>
                ) : (
                  meal.items.map((it, itIdx) => (
                    <div
                      key={itIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1fr 1fr 2fr 36px',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      {/* Supply select */}
                      <Select
                        options={supplyOptions}
                        value={it.supplyId}
                        onChange={(e) =>
                          handleItemChange(mIdx, itIdx, 'supplyId', e.target.value)
                        }
                      />

                      {/* Amount */}
                      <Input
                        type="number"
                        min="0.05"
                        step="0.1"
                        value={it.amount}
                        onChange={(e) =>
                          handleItemChange(mIdx, itIdx, 'amount', Number(e.target.value))
                        }
                        placeholder={tr('Amount')}
                      />

                      {/* Unit */}
                      <Input
                        type="text"
                        readOnly
                        value={it.unit}
                        style={{ background: 'var(--color-surface)', cursor: 'default' }}
                      />

                      {/* Notes */}
                      <Input
                        type="text"
                        value={it.notes || ''}
                        onChange={(e) =>
                          handleItemChange(mIdx, itIdx, 'notes', e.target.value)
                        }
                        placeholder={tr('Notes (e.g. soaked, mixed)')}
                      />

                      {/* Delete item */}
                      <Button
                        size="sm"
                        tone="ghost"
                        onClick={() => handleRemoveItem(mIdx, itIdx)}
                        style={{ color: '#EF4444', padding: '4px' }}
                        title={tr('Remove item')}
                      >
                        ✕
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section 4: Chỉ dẫn đặc biệt */}
        <Field label={tr('Special Instructions & Feeding Notes')}>
          <Textarea
            rows={3}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder={tr('e.g. Mix into warm mash, let rest for 30 minutes after training before feeding...')}
          />
        </Field>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            {tr('Cancel')}
          </Button>

          <Button
            tone="secondary"
            onClick={() => handleSave(false)}
            disabled={busy || loadingInitial}
          >
            {busy ? tr('Saving...') : tr('Save Draft')}
          </Button>

          <Button
            tone="primary"
            onClick={() => handleSave(true)}
            disabled={busy || loadingInitial}
          >
            {busy ? tr('Submitting...') : tr('Submit for Approval')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
