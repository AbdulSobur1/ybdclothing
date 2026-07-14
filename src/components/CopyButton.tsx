"use client";

import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

/**
 * A button that copies `text` to the clipboard and shows brief feedback.
 * Use on payment pages so users can easily copy bank account numbers.
 */
export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers or non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? "bg-emerald-100 text-emerald-700"
          : "bg-[#4A6B6D]/10 text-[#4A6B6D] hover:bg-[#4A6B6D]/20 active:scale-95"
      }`}
      title={copied ? "Copied!" : `Copy ${label}`}
      aria-label={copied ? "Copied!" : `Copy ${label}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
