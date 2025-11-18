'use client';

import { useState } from 'react';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.startsWith('postgresql://')) {
      toast.error('Invalid PostgreSQL connection string.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Attempting to connect to new database...');

    try {
      await api.post('/settings/db-url', { newUrl });
      toast.success('Database connection refreshed!', { id: toastId });
      setNewUrl('');
    } catch (error: any) {
      toast.error(
        `Connection failed: ${error.response?.data?.error || error.message}`,
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Database Settings</CardTitle>
        <CardDescription>
          Dynamically switch the backend's Neon Postgres connection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dbUrl">New Neon Connection URL</Label>
            <Input
              id="dbUrl"
              type="password" // Hide credentials
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="postgresql://user:password@host/dbname?sslmode=require"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Update and Refresh Connection'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}