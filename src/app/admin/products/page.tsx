"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

interface Variant {
  id: number;
  color: string | null;
  size: string | null;
  stockQuantity: number;
  sku: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  category: string;
  hasVariants: boolean;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  variants: Variant[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "cap",
    hasVariants: false,
    imageUrl: "",
    variants: [] as { color: string; size: string; stockQuantity: number; sku: string }[],
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  function openNewForm() {
    setEditingProduct(null);
    setForm({ name: "", description: "", basePrice: "", category: "cap", hasVariants: false, imageUrl: "", variants: [] });
    setShowForm(true);
    setMessage(null);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      basePrice: String(product.basePrice),
      category: product.category,
      hasVariants: product.hasVariants,
      imageUrl: product.imageUrl ?? "",
      variants: product.variants.map((v) => ({
        color: v.color ?? "",
        size: v.size ?? "",
        stockQuantity: v.stockQuantity,
        sku: v.sku ?? "",
      })),
    });
    setShowForm(true);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name: form.name,
        description: form.description || null,
        basePrice: parseInt(form.basePrice, 10),
        category: form.category,
        hasVariants: form.hasVariants,
        imageUrl: form.imageUrl || null,
        variants: form.hasVariants ? form.variants : [],
      };

      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editingProduct ? "Product updated!" : "Product created!" });
        setShowForm(false);
        loadProducts();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save product" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save product" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  }

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { color: "", size: "", stockQuantity: 0, sku: "" }],
    }));
  }

  function updateVariant(index: number, field: string, value: string | number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  }

  function removeVariant(index: number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
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
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button
          onClick={openNewForm}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16213e] rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingProduct ? "Edit Product" : "New Product"}
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
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Price (kobo) *</label>
                  <input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  >
                    <option value="cap">Cap</option>
                    <option value="tee">Tee</option>
                    <option value="hat">Hat</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={form.hasVariants}
                  onChange={(e) => setForm((f) => ({ ...f, hasVariants: e.target.checked }))}
                  className="rounded border-white/10"
                />
                <label htmlFor="hasVariants" className="text-sm text-gray-300">Has variants (colors/sizes)</label>
              </div>

              {form.hasVariants && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Variants</span>
                    <button type="button" onClick={addVariant} className="text-xs text-[#A6822E] hover:text-[#C4A85D]">
                      + Add variant
                    </button>
                  </div>
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        placeholder="Color"
                        value={v.color}
                        onChange={(e) => updateVariant(i, "color", e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E]"
                      />
                      <input
                        placeholder="Size"
                        value={v.size}
                        onChange={(e) => updateVariant(i, "size", e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E]"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stockQuantity}
                        onChange={(e) => updateVariant(i, "stockQuantity", parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E]"
                      />
                      <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-red-400 hover:text-red-300">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
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

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No products yet</p>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
          >
            <Plus className="h-4 w-4" /> Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-[#16213e] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditForm(product)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{product.name}</h3>
              <p className="text-xs text-gray-400 capitalize mb-1">{product.category}</p>
              <p className="text-sm font-medium text-[#A6822E]">{formatPrice(product.basePrice)}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  product.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                }`}>
                  {product.active ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px]">
                  {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
