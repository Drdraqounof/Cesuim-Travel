export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  liked?: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalNotes: number;
  totalLocations: number;
  lastActivity: string | null;
}