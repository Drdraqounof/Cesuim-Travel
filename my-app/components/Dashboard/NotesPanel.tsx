"use client";

import { useEffect, useState } from "react";
import { getNotes, saveNote, deleteNote } from "@/lib/storage";
import type { Note } from "@/lib/types";

export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const handleSave = () => {
    if (!newNote.trim()) return;
    const saved = saveNote(newNote);
    setNotes([saved, ...notes]);
    setNewNote("");
    setIsExpanded(false);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNotes(notes.filter((n) => n.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Notes</h3>
          <p className="text-xs text-slate-400">Capture your thoughts</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/20"
        >
          {isExpanded ? "Cancel" : "Add Note"}
        </button>
      </div>

      {isExpanded && (
        <div className="mb-4 space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/50"
            rows={3}
          />
          <button
            onClick={handleSave}
            disabled={!newNote.trim()}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Note
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No notes yet. Add your first note above.
          </p>
        ) : (
          notes.slice(0, 10).map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200 line-clamp-2">
                  {note.content}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(note.createdAt)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg
                  className="h-4 w-4 text-slate-400 hover:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}