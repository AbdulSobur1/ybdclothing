"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface StatusFormProps {
  orderId: number;
  currentStatus: string;
  customerEmail: string;
  customerName: string;
}

const STATUS_OPTIONS = [
  { value: "pending_verification", label: "Pending Verification" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
];

export function OrderStatusUpdateForm({
  orderId,
  currentStatus,
  customerEmail,
  customerName,
}: StatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus: status,
          customerEmail,
          customerName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Status updated! Email notification sent." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to update status" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={updating || status === currentStatus}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all disabled:opacity-50"
      >
        {updating && <Loader2 className="h-4 w-4 animate-spin" />}
        Update Status
      </button>
    </form>
  );
}
