import { Location, Note } from './types';

const STORAGE_KEYS = {
  LOCATIONS: 'terrascope_locations',
  NOTES: 'terrascope_notes',
};

export const getSavedLocations = (): Location[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
  return saved ? JSON.parse(saved) : [];
};

export const saveLocation = (location: Location) => {
  const locations = getSavedLocations();
  const updated = [location, ...locations];
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
};

export const deleteLocation = (id: string) => {
  const locations = getSavedLocations();
  const updated = locations.filter(loc => loc.id !== id);
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
};

export const getNotes = (): Note[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
  return saved ? JSON.parse(saved) : [];
};

export const saveNote = (note: Note) => {
  const notes = getNotes();
  const updated = [note, ...notes];
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const updated = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
};
