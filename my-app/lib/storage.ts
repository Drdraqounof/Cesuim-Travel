import type { Note, SavedLocation, DashboardStats } from "./types";

const NOTES_KEY = "terrascope_notes";
const LAST_SEARCH_KEY = "terrascope_last_search";

let sessionUser: { id: string; email: string; name: string | null } | null | undefined = undefined;

async function getSession() {
  if (sessionUser !== undefined) return sessionUser;
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    sessionUser = data.user ?? null;
  } catch {
    sessionUser = null;
  }
  return sessionUser;
}

export function resetSession() {
  sessionUser = undefined;
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getSession();
  return user !== null;
}

function toClientLocation(db: any): SavedLocation {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? "",
    latitude: db.latitude,
    longitude: db.longitude,
    elevation: db.elevation ?? undefined,
    liked: db.liked ?? false,
    createdAt: db.createdAt,
  };
}

export async function getLocations(): Promise<SavedLocation[]> {
  const res = await fetch("/api/locations");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.locations ?? []).map(toClientLocation);
}

export async function saveLocation(location: Omit<SavedLocation, "id" | "createdAt">): Promise<SavedLocation> {
  const res = await fetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });
  if (!res.ok) throw new Error("Failed to save location");
  const data = await res.json();
  return toClientLocation(data.location);
}

export async function deleteLocation(id: string): Promise<void> {
  await fetch(`/api/locations/${id}`, { method: "DELETE" });
}

export async function toggleLikeLocation(id: string): Promise<SavedLocation | null> {
  const locations = await getLocations();
  const loc = locations.find((l) => l.id === id);
  if (!loc) return null;
  const res = await fetch(`/api/locations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked: !loc.liked }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return toClientLocation(data.location);
}

export async function setLocationLiked(id: string, liked: boolean): Promise<SavedLocation | null> {
  const res = await fetch(`/api/locations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return toClientLocation(data.location);
}

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

export async function getStats(): Promise<DashboardStats> {
  const locations = await getLocations();
  const notes = getNotes();
  const allItems = [...notes, ...locations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return {
    totalNotes: notes.length,
    totalLocations: locations.length,
    lastActivity: allItems[0]?.createdAt ?? null,
  };
}
