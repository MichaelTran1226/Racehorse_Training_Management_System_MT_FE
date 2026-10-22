import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/form/Input';
import { Select } from '@/shared/components/form/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Alert } from '@/shared/components/ui/Alert';
import { useCurrentUser } from '@/shared/components/layout/AuthProvider';
import { tr } from '@/shared/i18n/tr';
import { messageFor } from '@/shared/lib/messages';
import { nutritionApi } from '../api/nutritionApi';
import { getZones } from '../api';
import { NutritionPlanModal } from '../components/NutritionPlanModal';
import { NutritionPlanDetailModal } from '../components/NutritionPlanDetailModal';
import type { NutritionPlan } from '../types/nutrition';
import type { Zone } from '../types';

export default function MealRationsPage() {
  const user = useCurrentUser();

  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  const [detailPlan, setDetailPlan] = useState<NutritionPlan | null>(null);

  const canCreate = user?.role === 'HEAD_TRAINER' || user?.role === 'CLUB_MANAGER';
  const isVet = user?.role === 'VETERINARIAN' || user?.role === 'CLUB_MANAGER';

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [plansRes, zonesRes] = await Promise.all([
        nutritionApi.list({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          zoneId: selectedZoneId !== 'ALL' ? selectedZoneId : undefined,
          search: search.trim() || undefined,
        }),
        getZones().catch(() => []),
      ]);
      setPlans(plansRes.items || []);
      setZones(zonesRes || []);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedZoneId]);

  // KPIs
  const stats = useMemo(() => {
    const totalActive = plans.filter((p) => p.status === 'APPROVED').length;
    const pendingReview = plans.filter((p) => p.status === 'PENDING_APPROVAL').length;
    const attentionCount = plans.filter((p) => !p.isWithinSafeRange).length;
    return { totalActive, pendingReview, attentionCount };
  }, [plans]);

  const statusBadgeTone: Record<string, 'neutral' | 'warn' | 'ok' | 'danger'> = {
    DRAFT: 'neutral',
    PENDING_APPROVAL: 'warn',
    APPROVED: 'ok',
    REJECTED: 'danger',
    ARCHIVED: 'neutral',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: tr('Draft'),
    PENDING_APPROVAL: tr('Pending Approval'),
    APPROVED: tr('Approved & Active'),
    REJECTED: tr('Rejected'),
    ARCHIVED: tr('Archived'),
  };

  const zoneOptions = useMemo(
    () => [
      { value: 'ALL', label: tr('All Barn Zones') },
      ...zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code})` })),
    ],
    [zones],
  );

  const filteredPlans = useMemo(() => {
    let result = plans;
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (p) =>
          (p.planCode && p.planCode.toLowerCase().includes(term)) ||
          (p.horse?.name && p.horse.name.toLowerCase().includes(term)) ||
          (p.horse?.horseCode && p.horse.horseCode.toLowerCase().includes(term)),
      );
    }
    return result;
  }, [plans, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <PageHeader
        title={tr('Nutrition & Feed Management')}
        description={tr(
          'Manage horse feed rations, scientific dietary limits (1.5% - 3.0%), and veterinarian review workflows.',
        )}
        action={
          canCreate ? (
            <Button
              tone="primary"
              onClick={() => {
                setEditingPlan(null);
                setCreateModalOpen(true);
              }}
            >
              + {tr('New Nutrition Plan')}
            </Button>
          ) : undefined
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card pad={16}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            {tr('Active Feeding Rations')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
            {stats.totalActive}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {tr('Approved plans in daily operation')}
          </div>
        </Card>

        <Card pad={16}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            {tr('Awaiting Vet Approval')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.pendingReview > 0 ? '#F59E0B' : 'var(--color-text-secondary)', marginTop: '4px' }}>
            {stats.pendingReview}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {isVet && stats.pendingReview > 0
              ? tr('Pending review by you')
              : tr('Submitted by Head Trainer')}
          </div>
        </Card>

        <Card pad={16}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            {tr('Nutritional Attention')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.attentionCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
            {stats.attentionCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {tr('Rations outside 1.5% - 3.0% threshold')}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card pad={16}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { id: 'ALL', label: tr('All Plans') },
              { id: 'PENDING_APPROVAL', label: tr('Pending Approval'), badge: stats.pendingReview },
              { id: 'APPROVED', label: tr('Approved & Active') },
              { id: 'DRAFT', label: tr('Drafts') },
              { id: 'REJECTED', label: tr('Rejected') },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    border: '1px solid',
                    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                    background: active ? 'var(--color-primary-subtle, rgba(59, 130, 246, 0.1))' : 'var(--color-surface)',
                    color: active ? 'var(--color-primary)' : 'var(--color-text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      style={{
                        background: active ? 'var(--color-primary)' : 'var(--color-border)',
                        color: active ? '#fff' : 'var(--color-text)',
                        fontSize: '0.75rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontWeight: 700,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Zone Dropdown */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Select
              options={zoneOptions}
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              style={{ width: '160px' }}
            />

            <Input
              type="text"
              placeholder={tr('Search horse, code...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>
        </div>
      </Card>

      {/* Main Table Content */}
      <Card pad={0}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            {tr('Loading nutrition plans...')}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem' }}>
            <EmptyState
              title={tr('No nutrition plans found')}
              description={
                statusFilter !== 'ALL'
                  ? tr('Try selecting a different status filter.')
                  : tr('Create a personalized feed ration for racehorses.')
              }
              action={
                canCreate ? (
                  <Button
                    tone="primary"
                    onClick={() => {
                      setEditingPlan(null);
                      setCreateModalOpen(true);
                    }}
                  >
                    + {tr('Create First Plan')}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--color-surface-subtle)',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Plan Code')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Horse')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Stall / Zone')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Daily Feed (kg)')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Body Ratio (%BW)')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Status')}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{tr('Updated')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((p) => {
                  const horse = p.horse;
                  const stall = p.currentStallCode || tr('Unassigned');
                  const zone = p.currentZone?.name || p.currentZone?.code || '';

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      {/* Code */}
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        {p.planCode || p.id.slice(0, 8)}
                      </td>

                      {/* Horse */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                            }}
                          >
                            {(horse?.name || 'H').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{horse?.name || tr('Unknown')}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                              {horse?.horseCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stall / Zone */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 500 }}>{stall}</span>
                        {zone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {zone}
                          </div>
                        )}
                      </td>

                      {/* Daily feed */}
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        {p.dailyFeedWeightKg} kg
                      </td>

                      {/* Ratio % with meter */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: p.isWithinSafeRange ? '#10B981' : '#F59E0B',
                            }}
                          >
                            {p.targetWeightRatioPct}%
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: p.isWithinSafeRange
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                              color: p.isWithinSafeRange ? '#10B981' : '#D97706',
                              fontWeight: 600,
                            }}
                          >
                            {p.isWithinSafeRange ? tr('Safe') : tr('Caution')}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge tone={statusBadgeTone[p.status] || 'neutral'}>
                          {statusLabels[p.status] || p.status}
                        </Badge>
                      </td>

                      {/* Updated Date */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Button
                            size="sm"
                            tone="secondary"
                            onClick={() => setDetailPlan(p)}
                          >
                            {p.status === 'PENDING_APPROVAL' && isVet
                              ? tr('Review')
                              : tr('Details')}
                          </Button>

                          {canCreate && (p.status === 'DRAFT' || p.status === 'REJECTED') && (
                            <Button
                              size="sm"
                              tone="ghost"
                              onClick={() => {
                                setEditingPlan(p);
                                setCreateModalOpen(true);
                              }}
                            >
                              {tr('Edit')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal tạo / sửa khẩu phần */}
      {createModalOpen && (
        <NutritionPlanModal
          plan={editingPlan}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingPlan(null);
          }}
          onSaved={() => {
            setCreateModalOpen(false);
            setEditingPlan(null);
            loadData();
          }}
        />
      )}

      {/* Modal chi tiết & phê duyệt */}
      {detailPlan && user && (
        <NutritionPlanDetailModal
          plan={detailPlan}
          currentRole={user.role}
          onClose={() => setDetailPlan(null)}
          onRefresh={() => loadData()}
          onEdit={(planToEdit) => {
            setDetailPlan(null);
            setEditingPlan(planToEdit);
            setCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
