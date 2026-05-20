export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  timestamp: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
  locationId?: string;
}
