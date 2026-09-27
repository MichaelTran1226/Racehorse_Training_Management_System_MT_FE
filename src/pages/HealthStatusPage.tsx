import React, { useEffect, useState } from 'react';
import { HeartPulse, CheckCircle2, AlertTriangle, RefreshCw, Database, Server } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  database: {
    connected: boolean;
    provider: string;
  };
}

export const HealthStatusPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      setHealth(json.data || json);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch backend health status');
      // Fallback mock state for visual preview
      setHealth({
        status: 'standby',
        service: 'EquiFlow Racehorse Training Management API',
        version: '0.1.0',
        uptime: 0,
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          provider: 'postgresql',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
            <HeartPulse className="w-8 h-8 text-forest-700" />
            <span>Hệ thống Health Probe &amp; Connectivity</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Kiểm tra trạng thái sẵn sàng của Backend NestJS và kết nối PostgreSQL qua Prisma ORM.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-forest-800 hover:bg-forest-900 text-white font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Backend chưa khởi động hoặc không thể kết nối tới port 3000:</p>
            <p className="mt-0.5">{error}. Chạy <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">npm run start:dev</code> trong thư mục Backend để kết nối thật.</p>
          </div>
        </div>
      )}

      {health && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                health.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {health.status === 'ok' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Overall Status</h3>
                <p className="text-sm text-gray-500 font-mono">
                  HTTP Code 200 · Status: <span className="uppercase font-semibold">{health.status}</span>
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              health.status === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {health.status}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Server className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase font-medium text-gray-500">Dịch vụ Backend</p>
                <p className="text-sm font-semibold text-gray-900">{health.service}</p>
                <p className="text-xs text-gray-500">Version: {health.version}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase font-medium text-gray-500">Cơ sở dữ liệu</p>
                <p className="text-sm font-semibold text-gray-900">
                  {health.database.provider.toUpperCase()} (Prisma ORM)
                </p>
                <p className="text-xs text-gray-500">
                  Trạng thái kết nối: {health.database.connected ? 'Connected' : 'Disconnected / Standby'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 text-xs text-gray-500 flex justify-between items-center font-mono">
            <span>Uptime: {health.uptime} seconds</span>
            <span>Timestamp: {health.timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};
