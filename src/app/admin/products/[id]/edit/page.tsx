"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Package,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { SkeletonLine } from "@/components/Skeleton";

interface Variant {
  id?: number;
  color: string;
  size: string;
  stockQuantity: number;
  sku: string;
}

interface ProductData {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  category: string;
  hasVariants: boolean;
  imageUrl: string | null;
  active: boolean;
  variants: Variant[];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "cap",
    hasVariants: false,
    imageUrl: "",
    active: true,
    variants: [] as Variant[],
  });
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { id } = await params;
      setIsNew(id === "new");
      if (id === "new") {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const data = await res.json();
          const found = data.products.find((p: ProductData) => String(p.id) === id);
          if (found) {
            setProduct(found);
            setForm({
              name: found.name,
              description: found.description ?? "",
              basePrice: String(found.basePrice),
              category: found.category,
              hasVariants: found.hasVariants,
              imageUrl: found.imageUrl ?? "",
              active: found.active,
              variants: found.variants.map((v: Variant) => ({
                id: v.id,
                color: v.color ?? "",
                size: v.size ?? "",
                stockQuantity: v.stockQuantity,
                sku: v.sku ?? "",
              })),
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...(isNew ? {} : { id: product!.id }),
        name: form.name,
        description: form.description || null,
        basePrice: parseInt(form.basePrice, 10),
        category: form.category,
        hasVariants: form.hasVariants,
        imageUrl: form.imageUrl || null,
        active: form.active,
        variants: form.hasVariants ? form.variants : [],
      };

      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: isNew ? "Product created!" : "Product updated!" });
        if (isNew) {
          const data = await res.json();
          router.push(`/admin/products/${data.product.id}/edit`);
        }
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

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { color: "", size: "", stockQuantity: 0, sku: "" }],
    }));
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
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
      <div className="space-y-6">
        <SkeletonLine className="h-5 w-40 bg-white/10" />
        <SkeletonLine className="h-8 w-64 bg-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLine key={i} className="h-12 w-full bg-white/10 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLine key={i} className="h-32 w-full bg-white/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "New Product" : `Edit: ${product?.name ?? ""}`}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isNew ? "Create a new product listing" : "Manage product details, variants, and stock"}
          </p>
        </div>
        <div className="flex-1" />
        <Link
          href="/admin/products"
          className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          Cancel
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm border ${
          message.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                    placeholder="e.g., Classic Logo Cap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Price (₦) *</label>
                    <input
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                      placeholder="15000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
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
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all resize-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Variants & Stock
                </h2>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasVariants}
                    onChange={(e) => setForm((f) => ({ ...f, hasVariants: e.target.checked, variants: e.target.checked ? f.variants : [] }))}
                    className="rounded border-white/10"
                  />
                  Has variants (colors/sizes)
                </label>
              </div>

              {!form.hasVariants ? (
                <div className="bg-white/5 rounded-lg p-4">
                  <label className="block text-xs text-gray-400 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={form.variants[0]?.stockQuantity ?? 999}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0;
                      setForm((f) => ({ ...f, variants: [{ color: "", size: "", stockQuantity: qty, sku: "" }] }));
                    }}
                    className="w-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#A6822E] transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Single variant product (no color/size options)</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{form.variants.length} variant{form.variants.length !== 1 ? "s" : ""}</span>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1 text-xs text-[#A6822E] hover:text-[#C4A85D] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variant
                    </button>
                  </div>

                  {form.variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm bg-white/5 rounded-lg">
                      No variants yet. Click "Add Variant" to create one.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left p-2 text-xs text-gray-400 font-medium">Color</th>
                            <th className="text-left p-2 text-xs text-gray-400 font-medium">Size</th>
                            <th className="text-left p-2 text-xs text-gray-400 font-medium">Stock</th>
                            <th className="text-left p-2 text-xs text-gray-400 font-medium">SKU</th>
                            <th className="p-2 w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {form.variants.map((v, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-2">
                                <input
                                  value={v.color}
                                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E] transition-all"
                                  placeholder="Black"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={v.size}
                                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E] transition-all"
                                  placeholder="M"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={v.stockQuantity}
                                  onChange={(e) => updateVariant(i, "stockQuantity", parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E] transition-all"
                                  min={0}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={v.sku}
                                  onChange={(e) => updateVariant(i, "sku", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A6822E] transition-all"
                                  placeholder="YBD-CAP-BLK-M"
                                />
                              </td>
                              <td className="p-2">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(i)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product Image</h2>
              <ProductImageUploader
                currentUrl={form.imageUrl || null}
                onImageUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url ?? "" }))}
              />
            </div>

            {/* Status */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Status</h2>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${
                  form.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {form.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {form.active ? "Active" : "Inactive"}
                </div>
                <span className="text-xs opacity-60">{form.active ? "Visible in shop" : "Hidden from shop"}</span>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">{form.basePrice ? formatPrice(parseInt(form.basePrice)) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white capitalize">{form.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Variants</span>
                  <span className="text-white">{form.hasVariants ? form.variants.length : "1 (no variants)"}</span>
                </div>
                {form.hasVariants && form.variants.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Stock</span>
                    <span className="text-white">{form.variants.reduce((sum, v) => sum + v.stockQuantity, 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isNew ? "Create Product" : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
