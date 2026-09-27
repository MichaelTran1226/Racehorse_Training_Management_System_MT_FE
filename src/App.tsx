import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { HealthStatusPage } from './pages/HealthStatusPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthStatusPage />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 EquiFlow. All rights reserved. Racehorse Training &amp; Stable Management System.</p>
      </footer>
    </div>
  );
};

export default App;
