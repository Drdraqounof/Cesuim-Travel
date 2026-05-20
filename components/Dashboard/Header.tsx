import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xl">T</span>
          </div>
          <h1 className="text-cyan-400 font-bold text-xl tracking-tight">TerraScope</h1>
        </div>
        <nav className="flex space-x-6">
          <Link href="/" className="text-slate-300 hover:text-cyan-400 transition-colors">Explorer</Link>
          <Link href="/dashboard" className="text-cyan-400 font-medium">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
