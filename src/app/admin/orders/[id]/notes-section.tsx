"use client";

import { useState } from "react";
import { MessageSquare, Plus, Loader2 } from "lucide-react";

interface Note {
  id: number;
  orderId: number;
  note: string;
  createdBy: string | null;
  createdAt: string;
}

export function NotesSection({ orderId, initialNotes }: { orderId: number; initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/order-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, note: noteText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNoteText("");
      }
    } catch {} finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#A6822E]" /> Notes
      </h2>

      <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add an internal note..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#A6822E] transition-all"
        />
        <button
          type="submit"
          disabled={adding || !noteText.trim()}
          className="px-3 py-2 rounded-lg bg-[#A6822E] text-white text-xs font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No notes yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-gray-300">{note.note}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {new Date(note.createdAt).toLocaleString("en-NG", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
