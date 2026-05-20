import React from 'react';

interface StatsProps {
  locationCount: number;
  notesCount: number;
}

const StatsCards = ({ locationCount, notesCount }: StatsProps) => {
  const stats = [
    { label: 'Saved Locations', value: locationCount, color: 'text-cyan-400' },
    { label: 'Active Notes', value: notesCount, color: 'text-cyan-400' },
    { label: 'Last Scan', value: 'Live', color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-800/50 border border-cyan-500/10 p-6 rounded-xl backdrop-blur-sm">
          <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
          <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
