import React, { useState } from 'react';
import { Note } from '../../lib/types';

interface NotesPanelProps {
  notes: Note[];
  onAdd: (content: string) => void;
  onDelete: (id: string) => void;
}

const NotesPanel = ({ notes, onAdd, onDelete }: NotesPanelProps) => {
  const [newNote, setNewNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAdd(newNote);
    setNewNote('');
  };

  return (
    <div className="bg-slate-800/50 border border-cyan-500/10 rounded-xl p-6 backdrop-blur-sm h-full">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Operations Journal</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Log observation..."
          className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none h-24"
        />
        <button
          type="submit"
          className="mt-2 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 rounded-lg transition-colors"
        >
          Add Note
        </button>
      </form>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {notes.map((note) => (
          <div key={note.id} className="bg-slate-900/40 border border-cyan-500/10 p-4 rounded-lg group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-cyan-500/50 uppercase tracking-wider font-mono">
                {new Date(note.timestamp).toLocaleString()}
              </span>
              <button
                onClick={() => onDelete(note.id)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-mono"
              >
                [DEL]
              </button>
            </div>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-slate-500 text-center italic text-sm py-4">No entries in journal</p>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
