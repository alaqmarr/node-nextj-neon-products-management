'use client';

import Link from 'next/link';
import { useTaskStore, Task, TaskStatus } from '../store/taskStore';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid,
  Settings,
  Package,
  Library,
  Tag,
  Goal,
  List,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Navigation ---
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/manage', label: 'View All Entities', icon: List },
  { href: '/brands', label: 'Brands', icon: Library },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/purposes', label: 'Purposes', icon: Goal },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const tasks = useTaskStore((state) => state.tasks);

  return (
    <aside className="w-80 h-screen bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-lg flex flex-col">
      {/* 1. Navigation */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* 2. Task Queue */}
      <div className="flex-1 p-4 border-t dark:border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Task Queue</h2>
        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-sm text-gray-500">No tasks in queue.</p>
          )}
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </aside>
  );
}

// --- Task Item (Remains the same) ---
const statusMap: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  queued: { label: 'Queued', icon: Clock, variant: 'secondary' },
  processing: { label: 'Processing', icon: Loader2, variant: 'default' },
  success: { label: 'Success', icon: CheckCircle, variant: 'default' },
  error: { label: 'Error', icon: XCircle, variant: 'destructive' },
};

function TaskItem({ task }: { task: Task }) {
  const statusInfo = statusMap[task.status];
  const Icon = statusInfo.icon;
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium capitalize">
          {task.type.replace('-', ' ')}
        </span>
        <Badge
          variant={statusInfo.variant}
          className={`
            ${task.status === 'success' ? 'bg-green-600 text-white' : ''}
            ${task.status === 'processing' ? 'animate-pulse' : ''}
          `}
        >
          <Icon
            className={`mr-1 h-3 w-3 ${
              task.status === 'processing' ? 'animate-spin' : ''
            }`}
          />
          {statusInfo.label}
        </Badge>
      </div>
      <p className="text-xs text-gray-400">ID: {task.id.split('-')[0]}...</p>
      {task.status === 'error' && (
        <p className="text-xs text-red-500 mt-1 truncate">Error: {task.error}</p>
      )}
    </div>
  );
}