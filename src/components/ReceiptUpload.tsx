"use client";

import { useState, useRef } from "react";
import { Upload, X, Check } from "lucide-react";

interface ReceiptUploadProps {
  /** Called with the selected file (or null if removed) */
  onFileSelected: (file: File | null) => void;
  /** Currently selected file */
  currentFile?: File | null;
  /** Order ID (shown after successful upload) */
  orderId?: number;
}

export function ReceiptUpload({ onFileSelected, currentFile }: ReceiptUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentFile ? URL.createObjectURL(currentFile) : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    if (!file) return;

    // Validate type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  function handleRemove() {
    setPreview(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-[#E0D8C8] group">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
              title="Remove receipt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium flex items-center gap-1">
            <Check className="h-3 w-3" /> Receipt added
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-lg border-2 border-dashed cursor-pointer transition-all p-6 flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-[#4A6B6D] bg-[#4A6B6D]/5"
              : "border-[#E0D8C8] bg-white hover:border-[#4A6B6D]/40 hover:bg-[#4A6B6D]/5"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#F2EDE1] flex items-center justify-center">
            <Upload className="h-5 w-5 text-[#4A6B6D]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#5A5A4A]">
              Drop your receipt here
            </p>
            <p className="text-xs text-[#8A9283] mt-1">
              or click to browse &middot; PNG, JPEG, WebP &middot; Max 5 MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />
    </div>
  );
}
