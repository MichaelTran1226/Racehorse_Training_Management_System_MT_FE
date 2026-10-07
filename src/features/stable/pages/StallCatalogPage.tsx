import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { DataTable } from "@/shared/components/ui/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { getStalls, deleteStall as apiDeleteStall } from "../api";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import type { Stall, StallAllocation } from "../types";

export default function StallCatalogPage() {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useCurrentUser();
  const isClubManager = currentUser.role === "CLUB_MANAGER";

  const loadStalls = useCallback(() => {
    setIsLoading(true);
    getStalls({ zone: selectedZone || undefined })
      .then(setStalls)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedZone]);

  useEffect(() => {
    loadStalls();
  }, [loadStalls]);

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteStall(id);
      loadStalls();
    } catch (e) {
      console.error(e);
      alert("Failed to delete stall.");
    }
  };

  const zones = Array.from(new Set(stalls.map((s: Stall) => s.zone))).sort();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <PageHeader
        title="Stall & Barn Directory"
        action={
          isClubManager && (
            <Button tone="primary" onClick={() => {}}>Add Stall</Button>
          )
        }
      />
      
      <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0 space-y-2">
          <h3 className="font-semibold text-slate-900 mb-4 px-2">Barn Zones</h3>
          <button
            onClick={() => setSelectedZone("")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedZone === "" ? "bg-green-100 text-green-800" : "hover:bg-slate-100 text-slate-700"}`}
          >
            All Zones
          </button>
          {zones.map((z: string) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedZone === z ? "bg-green-100 text-green-800" : "hover:bg-slate-100 text-slate-700"}`}
            >
              {z}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <DataTable<Stall>
            caption="List of barn stalls"
            rowKey={(row: Stall) => row.id}
            columns={[
              { key: "code", header: "Stall Code", render: (row: Stall) => row.code },
              { key: "zone", header: "Barn Zone", render: (row: Stall) => row.zone },
              { 
                key: "status", 
                header: "Status",
                render: (row: Stall) => {
                  const tone = row.status === "AVAILABLE" ? "ok" : row.status === "OCCUPIED" ? "warn" : "neutral";
                  return (
                    <Badge tone={tone}>
                      {row.status === "AVAILABLE" ? "Available" : row.status === "OCCUPIED" ? "Occupied" : "Maintenance"}
                    </Badge>
                  );
                }
              },
              { 
                key: "allocations",
                header: "Occupant Horse",
                render: (row: Stall) => {
                  const alloc = row.allocations.find((a: StallAllocation) => a.isActive);
                  return alloc ? <span>{alloc.horse.name}</span> : <span className="text-slate-400">Vacant</span>;
                }
              },
              { key: "notes", header: "Notes", render: (row: Stall) => row.notes || "" },
              ...(isClubManager ? [{
                key: "actions",
                header: "",
                align: "right" as const,
                render: (row: Stall) => (
                  <div className="flex justify-end gap-2">
                    <Button tone="ghost" size="sm" onClick={() => {}}>Edit</Button>
                    <Button 
                      tone="danger" 
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete stall ${row.code}?`)) {
                          handleDelete(row.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )
              }] : [])
            ]}
            rows={stalls}
            loading={isLoading}
            empty={<div className="p-8 text-center text-slate-400">No stalls found in this barn zone.</div>}
          />
        </div>
      </div>
    </div>
  );
}
