"use client";

import { useState, useEffect } from "react";
import { Banknote, MessageCircle, Save, Loader2 } from "lucide-react";
import { config } from "@/lib/config";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settings, setSettings] = useState({
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    whatsappNumber: "",
    ownerEmail: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // fallback to config defaults
      setSettings({
        bankName: config.bank.name,
        bankAccountName: config.bank.accountName,
        bankAccountNumber: config.bank.accountNumber,
        whatsappNumber: config.whatsappNumber,
        ownerEmail: config.ownerEmail,
      });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved! Note: some settings require Vercel env var changes to persist across deployments." });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your store configuration</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Settings */}
        <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-[#A6822E]" />
            Payment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings((s) => ({ ...s, bankName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Name</label>
              <input
                type="text"
                value={settings.bankAccountName}
                onChange={(e) => setSettings((s) => ({ ...s, bankAccountName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings((s) => ({ ...s, bankAccountNumber: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#A6822E]" />
            Contact & Notifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                placeholder="2348000000000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Owner Email</label>
              <input
                type="email"
                value={settings.ownerEmail}
                onChange={(e) => setSettings((s) => ({ ...s, ownerEmail: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-[#16213e] rounded-xl border border-white/5 p-4">
          <p className="text-xs text-gray-400">
            <strong className="text-white">Note:</strong> These settings are managed via environment variables on Vercel.
            Changes made here will apply during the current session, but for permanent changes you&apos;ll need to
            update the corresponding environment variables in the Vercel Dashboard.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </form>
    </div>
  );
}
