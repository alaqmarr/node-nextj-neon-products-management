'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Wifi,
  WifiOff,
  Clock,
  Server,
  Activity,
  RefreshCw,
  Settings,
  User,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DbStatus {
  status: 'healthy' | 'unhealthy';
  latency: string;
  dbUrl: string;
}

interface SystemStatus {
  database: boolean;
  api: boolean;
  websocket: boolean;
  lastChecked: string;
}

export function TopBar() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const [dbResponse, healthResponse] = await Promise.all([
        api.get<DbStatus>('/settings/db-status'),
        api.get<SystemStatus>('/health'),
      ]);
      
      setDbStatus(dbResponse.data);
      setSystemStatus(healthResponse.data);
      setLastUpdate(new Date());
    } catch (error: any) {
      setDbStatus({
        status: 'unhealthy',
        latency: 'N/A',
        dbUrl: error.response?.data?.dbUrl || 'Offline',
      });
      setSystemStatus({
        database: false,
        api: false,
        websocket: false,
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Ping every 30s
    return () => clearInterval(interval);
  }, []);

  const formatDbUrl = (url: string) => {
    if (!url) return 'Not Connected';
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname !== '/' ? urlObj.pathname : ''}`;
    } catch {
      return url.length > 30 ? `${url.substring(0, 30)}...` : url;
    }
  };

  const getLatencyColor = (latency: string) => {
    const num = parseInt(latency);
    if (isNaN(num)) return 'text-gray-500';
    if (num < 100) return 'text-green-600';
    if (num < 300) return 'text-amber-600';
    return 'text-red-600';
  };

  const getLatencyVariant = (latency: string) => {
    const num = parseInt(latency);
    if (isNaN(num)) return 'secondary';
    if (num < 100) return 'default';
    if (num < 300) return 'secondary';
    return 'destructive';
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left Section - Brand & Navigation */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Product Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">v2.0.0</p>
          </div>
        </div>

        {/* Database Connection Info */}
        <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-gray-700">
          <Server className="h-4 w-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400">Database</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {dbStatus ? formatDbUrl(dbStatus.dbUrl) : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Status & Controls */}
      <div className="flex items-center space-x-4">
        {/* Last Update Time */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center space-x-2">
          {/* Database Status */}
          {dbStatus && (
            <Badge 
              variant={getLatencyVariant(dbStatus.latency)}
              className="flex items-center space-x-1 px-3 py-1"
            >
              <Database className={cn(
                "h-3 w-3",
                dbStatus.status === 'healthy' ? 'text-green-500' : 'text-red-500'
              )} />
              <span className={getLatencyColor(dbStatus.latency)}>
                {dbStatus.latency}ms
              </span>
            </Badge>
          )}

          {/* API Status */}
          {systemStatus && (
            <Badge 
              variant={systemStatus.api ? 'default' : 'destructive'}
              className="flex items-center space-x-1 px-3 py-1"
            >
              <Activity className="h-3 w-3" />
              <span>API</span>
            </Badge>
          )}

          {/* WebSocket Status */}
          {systemStatus && (
            <Badge 
              variant={systemStatus.websocket ? 'default' : 'destructive'}
              className="hidden sm:flex items-center space-x-1 px-3 py-1"
            >
              {systemStatus.websocket ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span>WS</span>
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isRefreshing && "animate-spin"
            )} />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            asChild
          >
            <a href="/settings">
              <Settings className="h-4 w-4" />
            </a>
          </Button>

          {/* User Profile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Status Overlay */}
      {dbStatus && dbStatus.status === 'unhealthy' && (
        <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 px-4 py-1">
          <div className="flex items-center justify-center space-x-2 text-xs text-red-700 dark:text-red-300">
            <WifiOff className="h-3 w-3" />
            <span>Database connection issues</span>
          </div>
        </div>
      )}
    </header>
  );
}