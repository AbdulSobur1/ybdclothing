"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, Check } from "lucide-react";

interface ProductImageUploaderProps {
  /** Current image URL (if editing an existing product) */
  currentUrl?: string | null;
  /** Called with the final image URL after upload */
  onImageUploaded: (url: string | null) => void;
}

export function ProductImageUploader({ currentUrl, onImageUploaded }: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;

    // Client-side validation
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPEG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to upload image");
        return;
      }

      setPreview(data.imageUrl);
      onImageUploaded(data.imageUrl);
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onImageUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Product Image</label>

      {preview ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 group">
          <img
            src={preview}
            alt="Product preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-all"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`relative w-full aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-[#A6822E] bg-[#A6822E]/5"
              : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-[#A6822E] animate-spin" />
              <span className="text-xs text-gray-400">Uploading...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">
                Drop an image or click to browse
              </span>
              <span className="text-[10px] text-gray-500">
                PNG, JPEG or WebP · Max 5 MB
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}

      {preview && (
        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
          <Check className="h-3 w-3" /> Image uploaded
        </p>
      )}
    </div>
  );
}
