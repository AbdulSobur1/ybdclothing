"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Loader2, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { SkeletonLine } from "@/components/Skeleton";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string | null;
  rating: number;
  active: boolean;
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({ quote: "", author: "", role: "", rating: 5 });

  useEffect(() => { loadTestimonials(); }, []);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials);
      }
    } catch {} finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ quote: "", author: "", role: "", rating: 5 });
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({ quote: t.quote, author: t.author, role: t.role ?? "", rating: t.rating });
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
        ? { id: editing.id, ...form }
        : form;
      const res = await fetch("/api/admin/testimonials", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage({ type: "success", text: editing ? "Testimonial updated!" : "Testimonial created!" });
        setShowForm(false);
        loadTestimonials();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally { setSaving(false); }
  }

  async function toggleActive(t: Testimonial) {
    await fetch("/api/admin/testimonials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, active: !t.active }),
    });
    loadTestimonials();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadTestimonials();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLine className="h-7 w-40 bg-white/10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} className="h-32 w-full bg-white/10 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
          <p className="text-sm text-gray-400 mt-1">{testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
        >
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16213e] rounded-xl border border-white/10 w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editing ? "Edit Testimonial" : "New Testimonial"}
            </h2>
            {message && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                message.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>{message.text}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quote *</label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Author *</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role/Location</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                    placeholder="e.g., Lagos"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: star }))}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
                        star <= form.rating ? "bg-[#A6822E] text-white" : "bg-white/5 text-gray-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {testimonials.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No testimonials yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <span key={s} className="text-sm text-[#A6822E]">★</span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(t)}
                    className={`p-1.5 rounded-lg transition-all ${
                      t.active ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-300"
                    }`}
                    title={t.active ? "Deactivate" : "Activate"}
                  >
                    {t.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#A6822E]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#A6822E]">{t.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.author}</p>
                  {t.role && <p className="text-xs text-gray-400">{t.role}</p>}
                </div>
                <div className="flex-1" />
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  t.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                }`}>
                  {t.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
