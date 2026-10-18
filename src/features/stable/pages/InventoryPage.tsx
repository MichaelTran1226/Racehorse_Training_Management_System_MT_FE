import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert } from '@/shared/components/ui/Alert';
import { DataTable, type Column } from '@/shared/components/ui/DataTable';
import { Input } from '@/shared/components/form/Input';
import { Select } from '@/shared/components/form/Select';
import { useCurrentUser } from '@/shared/components/layout/AuthProvider';
import { useAppLanguage } from '@/shared/lib/language';
import { tr } from '@/shared/i18n/tr';
import { messageFor } from '@/shared/lib/messages';
import { getZones } from '../api';
import { getSupplies } from '@/features/master-data/api/suppliesApi';
import { inventoryApi } from '../api/inventoryApi';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { RestockRequestModal } from '../components/RestockRequestModal';
import type { StockHealthStatus, StockItemRow, SupplyCategory } from '../types/inventory';
import type { Zone } from '../types';
import type { SupplyCatalogItem } from '@/features/master-data/types/supplies';

const CATEGORY_NAMES: Record<SupplyCategory, string> = {
  FEED: 'Feed & Forage',
  MEDICINE: 'Medications & Vaccines',
  CARE: 'Daily Care & Supplements',
  EQUIPMENT: 'Grooming & Equipment',
};

export default function InventoryPage() {
  const currentUser = useCurrentUser();
  const isManager = currentUser.role === 'CLUB_MANAGER';
  const { isVietnamese } = useAppLanguage();

  const [zones, setZones] = useState<Zone[]>([]);
  const [supplies, setSupplies] = useState<SupplyCatalogItem[]>([]);
  const [items, setItems] = useState<StockItemRow[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals state
  const [adjustModalItem, setAdjustModalItem] = useState<StockItemRow | null | undefined>(undefined);
  const [requestModalPrefill, setRequestModalPrefill] = useState<{ zoneId?: string; supplyId?: string } | null>(null);

  // Load Zones & Supplies once
  useEffect(() => {
    async function loadMaster() {
      try {
        const [zList, sList] = await Promise.all([
          getZones(true),
          getSupplies({ status: 'ACTIVE' }),
        ]);
        setZones(zList);
        setSupplies(sList);
      } catch (err) {
        console.error('Failed to load zones or supplies:', err);
      }
    }
    loadMaster();
  }, []);

  // Fetch stock items
  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inventoryApi.listStock({
        zoneId: zoneFilter !== 'ALL' ? zoneFilter : undefined,
        category: categoryFilter !== 'ALL' ? (categoryFilter as SupplyCategory) : undefined,
        search: search.trim() || undefined,
        lowStockOnly: lowStockOnly || undefined,
      });
      setItems(res.items);
      setLowStockCount(res.lowStockCount);
      setOutOfStockCount(res.outOfStockCount);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, [zoneFilter, categoryFilter, search, lowStockOnly]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const zoneOptions = useMemo(() => {
    return [
      { value: 'ALL', label: tr('All Stall Zones') },
      ...zones.map((z) => ({ value: z.id, label: `${z.code} - ${z.name}` })),
    ];
  }, [zones, isVietnamese]);

  const categoryOptions = useMemo(() => {
    return [
      { value: 'ALL', label: tr('All Categories') },
      { value: 'FEED', label: tr('Feed & Forage') },
      { value: 'MEDICINE', label: tr('Medications & Vaccines') },
      { value: 'CARE', label: tr('Daily Care & Supplements') },
      { value: 'EQUIPMENT', label: tr('Grooming & Equipment') },
    ];
  }, [isVietnamese]);

  const sufficientCount = useMemo(
    () => items.filter((i) => i.status === 'SUFFICIENT').length,
    [items],
  );

  const getStatusBadge = (status: StockHealthStatus, qty: number, unit: string) => {
    switch (status) {
      case 'SUFFICIENT':
        return (
          <Badge tone="ok">
            {tr('Sufficient')} ({qty} {unit})
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge tone="warn">
            {tr('Low Stock')} ({qty} {unit})
          </Badge>
        );
      case 'OUT_OF_STOCK':
        return (
          <Badge tone="danger">
            {tr('Out of Stock')} ({qty} {unit})
          </Badge>
        );
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  const columns: Column<StockItemRow>[] = useMemo(
    () => [
      {
        key: 'zone',
        header: tr('Stall Zone'),
        width: '180px',
        render: (row) => (
          <div>
            <strong style={{ color: 'var(--ink)' }}>{row.zoneName}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
              {row.zoneCode}
            </div>
          </div>
        ),
      },
      {
        key: 'supply',
        header: tr('Supply Item'),
        render: (row) => {
          const catLabel = CATEGORY_NAMES[row.category] || row.category;
          return (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{row.supplyName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                {row.supplyCode} · {tr(catLabel)}
              </div>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: tr('Stock Health & Balance'),
        width: '210px',
        render: (row) => getStatusBadge(row.status, row.quantity, row.unit),
      },
      {
        key: 'minThreshold',
        header: tr('Min Alert Threshold'),
        width: '140px',
        align: 'right',
        render: (row) => (
          <span>
            {row.minThreshold} {row.unit}
          </span>
        ),
      },
      {
        key: 'lastInventory',
        header: tr('Last Inventory Check'),
        render: (row) => (
          <div style={{ fontSize: '0.8125rem' }}>
            {row.lastInventoryDate ? (
              <>
                <div>{new Date(row.lastInventoryDate).toLocaleDateString('vi-VN')}</div>
                {row.lastAdjustedBy && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    {row.lastAdjustedBy.fullName}
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--muted)' }}>—</span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: tr('Actions'),
        width: '230px',
        align: 'right',
        render: (row) => (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button
              size="sm"
              tone="secondary"
              onClick={() => setRequestModalPrefill({ zoneId: row.zoneId, supplyId: row.supplyId })}
            >
              {tr('Request Restock')}
            </Button>
            {isManager && (
              <Button
                size="sm"
                tone="primary"
                onClick={() => setAdjustModalItem(row)}
              >
                {tr('Adjust')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [isManager, isVietnamese],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title={tr('Zone Supply Inventory')}
        description={tr('Track real-time stock levels, health status, and physical counts across stall zones.')}
        action={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              tone="secondary"
              onClick={() => setRequestModalPrefill({})}
            >
              + {tr('Propose Restock')}
            </Button>
            {isManager && (
              <Button
                tone="primary"
                onClick={() => setAdjustModalItem(null)}
              >
                + {tr('Adjust Physical Count')}
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card pad={16}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{tr('Total Monitored Items')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--ink)' }}>
            {items.length}
          </div>
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{tr('Sufficient Stock')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-ok)' }}>
            {sufficientCount}
          </div>
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{tr('Low Stock Alerts')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-warn)' }}>
            {lowStockCount}
          </div>
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{tr('Out of Stock')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-danger)' }}>
            {outOfStockCount}
          </div>
        </Card>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {/* Filters Toolbar */}
      <Card pad={16}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
            <Select
              options={zoneOptions}
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '220px', flex: '2 1 220px' }}>
            <Input
              placeholder={tr('Search by supply code or name...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              color: 'var(--ink)',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <span>{tr('Only show shortage warnings (Low & Out of stock)')}</span>
          </label>
        </div>
      </Card>

      {/* Main Stock Table */}
      <Card pad={0}>
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          loading={loading}
          caption="Stall Zone Supply Inventory Table"
        />
      </Card>

      {/* Adjust Stock Modal (Club Manager) */}
      {adjustModalItem !== undefined && (
        <StockAdjustModal
          stockItem={adjustModalItem}
          zones={zones}
          supplies={supplies}
          onClose={() => setAdjustModalItem(undefined)}
          onSaved={fetchStock}
        />
      )}

      {/* Request Restock Modal */}
      {requestModalPrefill !== null && (
        <RestockRequestModal
          zones={zones}
          supplies={supplies}
          defaultZoneId={requestModalPrefill.zoneId}
          defaultSupplyId={requestModalPrefill.supplyId}
          onClose={() => setRequestModalPrefill(null)}
          onSaved={fetchStock}
        />
      )}
    </div>
  );
}
