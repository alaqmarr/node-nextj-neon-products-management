'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  RefreshCw, 
  Shield, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Server,
  Link as LinkIcon,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DbStatus {
  status: 'healthy' | 'unhealthy';
  latency: string;
  dbUrl: string;
}

export default function SettingsPage() {
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch current database status
  const fetchDbStatus = async () => {
    try {
      const { data } = await api.get<DbStatus>('/settings/db-status');
      setDbStatus(data);
    } catch (error) {
      setDbStatus({
        status: 'unhealthy',
        latency: 'N/A',
        dbUrl: 'Unable to fetch status',
      });
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUrl.trim()) {
      toast.error('Please enter a connection string');
      return;
    }

    if (!newUrl.startsWith('postgresql://')) {
      toast.error('Invalid PostgreSQL connection string. Must start with "postgresql://"');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Testing and connecting to new database...');

    try {
      await api.post('/settings/db-url', { newUrl });
      toast.success('Database connection updated successfully!', { 
        id: toastId,
        duration: 4000,
      });
      setNewUrl('');
      // Refresh status after update
      setTimeout(() => fetchDbStatus(), 1000);
    } catch (error: any) {
      toast.error(
        `Connection failed: ${error.response?.data?.error || error.message}`,
        { 
          id: toastId,
          duration: 5000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!newUrl.trim()) {
      toast.error('Please enter a connection string to test');
      return;
    }

    setIsTesting(true);
    const toastId = toast.loading('Testing database connection...');

    try {
      // This would need a dedicated test endpoint
      await api.post('/settings/test-connection', { newUrl });
      toast.success('Connection test successful!', { id: toastId });
    } catch (error: any) {
      toast.error(
        `Connection test failed: ${error.response?.data?.error || 'Invalid connection string'}`,
        { id: toastId }
      );
    } finally {
      setIsTesting(false);
    }
  };

  const formatDbUrl = (url: string) => {
    if (!url) return 'Not connected';
    try {
      const urlObj = new URL(url);
      const username = urlObj.username;
      const hostname = urlObj.hostname;
      const database = urlObj.pathname.replace('/', '');
      return `${username}@${hostname}/${database}`;
    } catch {
      return url.length > 40 ? `${url.substring(0, 40)}...` : url;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
          Database Settings
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Manage your Neon Postgres connection and monitor database health
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Current Connection Status */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/20 dark:from-gray-900 dark:to-gray-800/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Current Connection</CardTitle>
                <CardDescription>
                  Real-time database status and metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dbStatus ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    {dbStatus.status === 'healthy' ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Database Status
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {dbStatus.status === 'healthy' ? 'All systems operational' : 'Connection issues detected'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={dbStatus.status === 'healthy' ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {dbStatus.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-500">Latency</Label>
                    <div className={cn(
                      "text-lg font-semibold",
                      dbStatus.latency && parseInt(dbStatus.latency) < 100 ? "text-green-600" :
                      dbStatus.latency && parseInt(dbStatus.latency) < 300 ? "text-amber-600" : "text-red-600"
                    )}>
                      {dbStatus.latency || 'N/A'}ms
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-500">Connection</Label>
                    <div className="text-sm font-mono text-slate-600 dark:text-slate-400 truncate">
                      {formatDbUrl(dbStatus.dbUrl)}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={fetchDbStatus}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh Status
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">Loading database status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Connection */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50/20 dark:from-gray-900 dark:to-gray-800/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Update Connection</CardTitle>
                <CardDescription>
                  Switch to a different Neon Postgres database
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="dbUrl" className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-slate-400" />
                  Neon Connection URL
                  <Shield className="h-3 w-3 text-green-500" />
                </Label>
                
                <div className="relative">
                  <Input
                    id="dbUrl"
                    type={showUrl ? "text" : "password"}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="postgresql://username:password@host.neon.tech/database?sslmode=require"
                    required
                    disabled={isLoading}
                    className={cn(
                      "h-12 pr-12 font-mono text-sm",
                      "border-slate-300 dark:border-gray-600",
                      "focus:border-blue-500 dark:focus:border-blue-400",
                      isLoading && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrl(!showUrl)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showUrl ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>

                {/* Connection Tips */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Connection Requirements
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Must start with <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">postgresql://</code></li>
                        <li>• Include SSL mode parameter (<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">?sslmode=require</code>)</li>
                        <li>• Use your Neon project connection string</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || !newUrl.trim()}
                  className={cn(
                    "flex-1 h-12 font-semibold transition-all",
                    "bg-gradient-to-r from-amber-500 to-orange-500",
                    "hover:from-amber-600 hover:to-orange-600",
                    "shadow-lg hover:shadow-xl",
                    (isLoading || !newUrl.trim()) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Updating Connection...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Update Database
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !newUrl.trim()}
                  className="h-12 px-4"
                >
                  {isTesting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  🔒 Your connection string is encrypted and never stored in plain text
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}