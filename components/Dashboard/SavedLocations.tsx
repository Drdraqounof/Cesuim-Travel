import React from 'react';
import { Location } from '../../lib/types';

interface SavedLocationsProps {
  locations: Location[];
  onDelete: (id: string) => void;
}

const SavedLocations = ({ locations, onDelete }: SavedLocationsProps) => {
  return (
    <div className="bg-slate-800/50 border border-cyan-500/10 rounded-xl p-6 backdrop-blur-sm h-full">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Coordinates Database</h2>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-slate-900/40 border border-cyan-500/10 p-4 rounded-lg flex justify-between items-center group">
            <div>
              <h3 className="text-slate-200 font-medium">{loc.name}</h3>
              <p className="text-[10px] text-cyan-500/50 font-mono mt-1">
                {loc.lat.toFixed(4)}°N, {loc.lng.toFixed(4)}°E
              </p>
            </div>
            <button
              onClick={() => onDelete(loc.id)}
              className="px-3 py-1 text-xs border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500 transition-all rounded"
            >
              PURGE
            </button>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-slate-500 text-center italic text-sm py-8">No saved coordinates</p>
        )}
      </div>
    </div>
  );
};

export default SavedLocations;
