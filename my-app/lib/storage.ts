import type { Note, SavedLocation, DashboardStats } from "./types";

const NOTES_KEY = "terrascope_notes";
const LOCATIONS_KEY = "terrascope_locations";
const LAST_SEARCH_KEY = "terrascope_last_search";

export function getNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(NOTES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveNote(content: string): Note {
  const notes = getNotes();
  const newNote: Note = {
    id: crypto.randomUUID(),
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(newNote);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return newNote;
}

export function updateNote(id: string, content: string): Note | null {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  notes[index] = {
    ...notes[index],
    content,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes[index];
}

export function deleteNote(id: string): void {
  const notes = getNotes().filter((n) => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getLocations(): SavedLocation[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveLocation(location: Omit<SavedLocation, "id" | "createdAt">): SavedLocation {
  const locations = getLocations();
  const newLocation: SavedLocation = {
    ...location,
    liked: location.liked ?? false,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  locations.unshift(newLocation);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return newLocation;
}

export function deleteLocation(id: string): void {
  const locations = getLocations().filter((l) => l.id !== id);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
}

export function toggleLikeLocation(id: string): SavedLocation | null {
  const locations = getLocations();
  const index = locations.findIndex((l) => l.id === id);
  if (index === -1) return null;
  locations[index].liked = !locations[index].liked;
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return locations[index];
}

export function setLocationLiked(id: string, liked: boolean): SavedLocation | null {
  const locations = getLocations();
  const index = locations.findIndex((l) => l.id === id);
  if (index === -1) return null;
  locations[index].liked = liked;
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return locations[index];
}

export function getLastSearch(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SEARCH_KEY);
}

export function setLastSearch(query: string | null): void {
  if (typeof window === "undefined") return;
  if (query === null) {
    localStorage.removeItem(LAST_SEARCH_KEY);
  } else {
    localStorage.setItem(LAST_SEARCH_KEY, query);
  }
}

export function getStats(): DashboardStats {
  const notes = getNotes();
  const locations = getLocations();
  const allItems = [...notes, ...locations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return {
    totalNotes: notes.length,
    totalLocations: locations.length,
    lastActivity: allItems[0]?.createdAt ?? null,
  };
}