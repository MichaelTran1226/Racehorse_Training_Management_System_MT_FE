import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Icon } from "@/shared/components/ui/Icon";
import { Button } from "@/shared/components/ui/Button";
import { StallGrid, StallCell, StallLegend, type StallStatus } from "@/shared/components/ui/StallGrid";
import { getStalls, getZones } from "../api";
import type { Stall, StallAllocation } from "../types";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";

export default function StableMapPage() {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);

  const [zones, setZones] = useState<string[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useCurrentUser();
  const isOwner = currentUser.role === "HORSE_OWNER";

  useEffect(() => {
    getZones().then((res) => {
      setZones(res);
      if (res.length > 0 && !selectedZone) setSelectedZone(res[0]);
    }).catch(console.error);
  }, []);

  const loadStalls = useCallback(() => {
    setIsLoading(true);
    getStalls({ zone: selectedZone, search: searchQuery })
      .then(setStalls)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedZone, searchQuery]);

  useEffect(() => {
    if (selectedZone || searchQuery) {
      const timer = setTimeout(loadStalls, 300);
      return () => clearTimeout(timer);
    } else if (selectedZone === "") {
      loadStalls();
    }
  }, [selectedZone, searchQuery, loadStalls]);

  if (isOwner) {
    return <div className="p-8 text-center text-slate-500">You do not have permission to view the stable map.</div>;
  }

  const selectedStall = stalls.find((s: Stall) => s.id === selectedStallId);

  const renderPanel = () => {
    if (!selectedStall) return null;
    const activeAlloc = selectedStall.allocations.find((a: StallAllocation) => a.isActive);

    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col fixed right-0 top-16 bottom-0 shadow-xl overflow-y-auto z-10">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Chi tiết ô chuồng</h3>
          <button onClick={() => setSelectedStallId(null)} className="text-slate-400 hover:text-slate-600">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Mã ô chuồng</div>
            <div className="font-semibold text-lg">{selectedStall.code}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Trạng thái ô</div>
            <div className="font-medium">
              {selectedStall.status === "MAINTENANCE" ? "Bảo trì" : selectedStall.status === "OCCUPIED" ? "Có ngựa" : "Trống"}
            </div>
          </div>
          {selectedStall.notes && (
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Ghi chú ô</div>
              <div className="text-sm">{selectedStall.notes}</div>
            </div>
          )}

          <hr className="border-slate-100" />

          {activeAlloc ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Ngựa đang ở</div>
                <div className="font-medium text-slate-900">{activeAlloc.horse.name}</div>
                <div className="text-sm text-slate-500">{activeAlloc.horse.code}</div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link to={`/horses/${activeAlloc.horse.id}`}>
                  <Button tone="secondary" block>Xem hồ sơ ngựa</Button>
                </Link>
                <Button tone="ghost" block>Chuyển ô</Button>
                <Button tone="danger" block>Trả ô</Button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="text-sm text-slate-500 mb-4">Ô chuồng này đang trống.</div>
              {selectedStall.status !== "MAINTENANCE" && (
                <Button tone="primary" block>Gán ngựa vào ô</Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <PageHeader
        title="Sơ đồ chuồng trại"
        action={
          <div className="flex items-center gap-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {zones.length === 0 && <option value="">(Không có khu chuồng)</option>}
              {zones.map((z: string) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã ô, tên ngựa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 flex">
        <div className="flex-1 max-w-6xl mx-auto space-y-6 pb-20">
          <StallLegend />
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">Đang tải sơ đồ...</div>
          ) : stalls.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              Không có ô chuồng nào phù hợp.
            </div>
          ) : (
            <StallGrid columns={6}>
              {stalls.map((stall: Stall) => {
                const alloc = stall.allocations.find((a: StallAllocation) => a.isActive);
                let status: StallStatus = "EMPTY";
                if (alloc) {
                  status = alloc.horse.status as StallStatus;
                } else if (stall.status === "MAINTENANCE") {
                  status = "EMPTY";
                }

                return (
                  <StallCell
                    key={stall.id}
                    code={stall.code}
                    horse={alloc?.horse.name}
                    status={status}
                    selected={selectedStallId === stall.id}
                    onClick={() => setSelectedStallId(stall.id)}
                  />
                );
              })}
            </StallGrid>
          )}
        </div>
      </div>
      {renderPanel()}
    </div>
  );
}
