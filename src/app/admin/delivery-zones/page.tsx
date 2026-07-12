"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { MapPin, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

interface DeliveryZone {
  id: number;
  zoneName: string;
  fee: number;
  active: boolean;
}

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-zones");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setZoneName("");
    setFee("");
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(zone: DeliveryZone) {
    setEditing(zone);
    setZoneName(zone.zoneName);
    setFee(String(zone.fee));
    setShowForm(true);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { id: editing.id, zoneName, fee: parseInt(fee, 10) }
        : { zoneName, fee: parseInt(fee, 10) };

      const res = await fetch("/api/admin/delivery-zones", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editing ? "Zone updated!" : "Zone created!" });
        setShowForm(false);
        loadZones();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(zone: DeliveryZone) {
    try {
      await fetch("/api/admin/delivery-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: zone.id, active: !zone.active }),
      });
      loadZones();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#A6822E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery Zones</h1>
          <p className="text-sm text-gray-400 mt-1">
            {zones.length} zone{zones.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
        >
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16213e] rounded-xl border border-white/10 w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editing ? "Edit Zone" : "New Zone"}
            </h2>
            {message && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                message.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  placeholder="e.g., Lagos Mainland"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Delivery Fee (kobo) *</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  placeholder={String(15000)}
                />
                <p className="text-xs text-gray-500 mt-1">Example: 15000 = ₦150</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update Zone" : "Create Zone"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zones list */}
      {zones.length === 0 ? (
        <div className="text-center py-20">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No delivery zones configured</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
          >
            <Plus className="h-4 w-4" /> Add Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-[#16213e] rounded-xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(zone)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{zone.zoneName}</h3>
              <p className="text-lg font-bold text-[#A6822E] mb-2">{formatPrice(zone.fee)}</p>
              <button
                onClick={() => toggleActive(zone)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  zone.active
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                }`}
              >
                {zone.active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
