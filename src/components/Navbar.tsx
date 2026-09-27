import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Compass, HeartPulse } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-forest-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white hover:text-forest-100 transition-colors">
              <Compass className="w-7 h-7 text-gold-500" />
              <span>EquiFlow</span>
            </Link>
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider bg-forest-700 text-forest-200 px-2 py-0.5 rounded font-medium">
              V2 Architecture
            </span>
          </div>
          <nav className="flex space-x-4 items-center">
            <Link
              to="/"
              className="text-sm font-medium text-forest-100 hover:text-white px-3 py-2 rounded-md hover:bg-forest-700 transition-colors"
            >
              Overview
            </Link>
            <Link
              to="/health"
              className="flex items-center space-x-1 text-sm font-medium text-forest-100 hover:text-white px-3 py-2 rounded-md hover:bg-forest-700 transition-colors"
            >
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span>Health Probe</span>
            </Link>
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm font-medium bg-gold-500 hover:bg-gold-600 text-forest-950 px-3 py-1.5 rounded-md font-semibold transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Swagger API</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
