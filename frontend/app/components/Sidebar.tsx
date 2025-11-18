'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Database,
  Users,
  Activity,
  ChevronRight,
  Home,
  FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Navigation ---
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/manage', label: 'Manage Entities', icon: FolderOpen },
  { href: '/brands', label: 'Brands', icon: Library },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/purposes', label: 'Purposes', icon: Goal },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const entityItems = [
  { href: '/brands', label: 'Brands', icon: Library },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/purposes', label: 'Purposes', icon: Goal },
];

export function Sidebar() {
  const pathname = usePathname();
  const tasks = useTaskStore((state) => state.tasks);
  const activeTasks = tasks.filter(task => task.status === 'queued' || task.status === 'processing');
  const completedTasks = tasks.filter(task => task.status === 'success' || task.status === 'error');

  return (
    <aside className="w-80 h-screen bg-gradient-to-b from-slate-50 to-blue-50/20 dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 border-r border-slate-200 dark:border-gray-700 shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Product Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">v2.0.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Online</span>
        </div>
      </div>

      {/* 1. Navigation */}
      <div className="p-6 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:border hover:border-slate-200 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-center">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500",
                    isActive && "scale-110"
                  )} />
                  <span className="ml-3 font-medium">{item.label}</span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isActive ? "text-white opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100",
                  isActive && "translate-x-0.5"
                )} />
              </Link>
            );
          })}
        </nav>

        {/* Entity Management Section */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
            Entities
          </h3>
          <div className="space-y-1">
            {entityItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-slate-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-gray-700" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Task Queue */}
      <div className="border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Task Queue
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activeTasks.length} Active
              </Badge>
            </div>
          </div>
          
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="space-y-3 mb-4">
              {activeTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Completed Tasks (Collapsible) */}
          {completedTasks.length > 0 && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300">
                <span>Recent Completed ({completedTasks.length})</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3 space-y-2">
                {completedTasks.slice(0, 3).map((task) => (
                  <TaskItem key={task.id} task={task} compact />
                ))}
              </div>
            </details>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No tasks in queue</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Tasks will appear here as you work
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// --- Enhanced Task Item ---
const statusMap: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
    bgColor: string;
  }
> = {
  queued: { 
    label: 'Queued', 
    icon: Clock, 
    variant: 'secondary',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20'
  },
  processing: { 
    label: 'Processing', 
    icon: Loader2, 
    variant: 'default',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  success: { 
    label: 'Success', 
    icon: CheckCircle, 
    variant: 'default',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  error: { 
    label: 'Error', 
    icon: XCircle, 
    variant: 'destructive',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20'
  },
};

function TaskItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  const statusInfo = statusMap[task.status];
  const Icon = statusInfo.icon;
  
  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'product': return Package;
      case 'brand': return Library;
      case 'category': return Tag;
      case 'purpose': return Goal;
      default: return Activity;
    }
  };

  const EntityIcon = getEntityIcon(task.type.split('-')[1] || 'activity');

  if (compact) {
    return (
      <div className={cn(
        "p-2 rounded-lg border-l-4 transition-all duration-200",
        statusInfo.bgColor,
        `border-l-${statusInfo.color.split('-')[1]}-500`
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EntityIcon className="h-3 w-3 text-slate-500" />
            <span className="text-xs font-medium capitalize">
              {task.type}
            </span>
          </div>
          <Icon className={cn(
            "h-3 w-3",
            statusInfo.color,
            task.status === 'processing' && 'animate-spin'
          )} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
      statusInfo.bgColor,
      "border-slate-200 dark:border-gray-600"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            statusInfo.bgColor
          )}>
            <EntityIcon className={cn("h-4 w-4", statusInfo.color)} />
          </div>
          <div>
            <p className="font-medium text-sm capitalize">
              {task.type.replace('-', ' ')} {task.entity}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ID: {task.id.split('-')[0]}...
            </p>
          </div>
        </div>
        <Badge
          variant={statusInfo.variant}
          className={cn(
            "text-xs font-medium",
            task.status === 'success' && "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
            task.status === 'processing' && "animate-pulse bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
            task.status === 'error' && "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
            task.status === 'queued' && "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
          )}
        >
          <Icon
            className={cn(
              "mr-1 h-3 w-3",
              task.status === 'processing' && 'animate-spin'
            )}
          />
          {statusInfo.label}
        </Badge>
      </div>
      
      {task.status === 'error' && task.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 truncate">
            {task.error}
          </p>
        </div>
      )}
      
      {task.payload?.name && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 truncate">
          {task.payload.name}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-gray-600">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(task.createdAt).toLocaleTimeString()}
        </p>
        {task.status === 'processing' && (
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}