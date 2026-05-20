'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Dashboard/Header';
import StatsCards from '../../components/Dashboard/StatsCards';
import NotesPanel from '../../components/Dashboard/NotesPanel';
import SavedLocations from '../../components/Dashboard/SavedLocations';
import { Location, Note } from '../../lib/types';
import { getSavedLocations, getNotes, saveNote, deleteNote, deleteLocation } from '../../lib/storage';

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setLocations(getSavedLocations());
    setNotes(getNotes());
  }, []);

  const handleAddNote = (content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      timestamp: Date.now(),
    };
    saveNote(newNote);
    setNotes([newNote, ...notes]);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleDeleteLocation = (id: string) => {
    deleteLocation(id);
    setLocations(locations.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-12 px-4 selection:bg-cyan-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Mission Control
          </h1>
          <p className="text-slate-400">Manage saved exploration coordinates and mission notes.</p>
        </div>

        <StatsCards locationCount={locations.length} notesCount={notes.length} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SavedLocations locations={locations} onDelete={handleDeleteLocation} />
          </div>
          <div>
            <NotesPanel notes={notes} onAdd={handleAddNote} onDelete={handleDeleteNote} />
          </div>
        </div>
      </main>
      
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_50%)]" />
    </div>
  );
}
