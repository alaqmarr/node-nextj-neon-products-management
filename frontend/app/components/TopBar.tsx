'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '@/components/ui/badge';

interface DbStatus {
  status: 'healthy' | 'unhealthy';
  latency: string;
  dbUrl: string;
}

export function TopBar() {
  const [status, setStatus] = useState<DbStatus | null>(null);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get<DbStatus>('/settings/db-status');
      setStatus(data);
    } catch (error: any) {
      setStatus({
        status: 'unhealthy',
        latency: 'N/A',
        dbUrl: error.response?.data?.dbUrl || 'Offline',
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Ping every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">Product Management</h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">
          DB: <span className="font-medium text-gray-800 dark:text-gray-200">{status?.dbUrl}</span>
        </span>
        {status && (
          <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
            {status.status === 'healthy' ? (
              <span className="h-2 w-2 mr-2 bg-green-500 rounded-full" />
            ) : (
              <span className="h-2 w-2 mr-2 bg-red-500 rounded-full" />
            )}
            {status.status} ({status.latency})
          </Badge>
        )}
      </div>
    </header>
  );
}