import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Library,
  Tag,
  Goal,
  ArrowRight,
  ClipboardList,
  Plus,
  Settings,
  Database,
  Activity,
  Users,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  productCount: number;
  brandCount: number;
  categoryCount: number;
  purposeCount: number;
}

interface RecentActivity {
  id: string;
  type: string;
  entity: string;
  status: string;
  createdAt: string;
  description: string;
  brandName?: string;
}

interface SystemStatus {
  database: boolean;
  api: boolean;
  websocket: boolean;
  lastChecked: string;
}

interface TrendData {
  productGrowth: number;
  brandGrowth: number;
  categoryGrowth: number;
  purposeGrowth: number;
}

// Fetch dashboard stats from the server
async function getStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      productCount: 0,
      brandCount: 0,
      categoryCount: 0,
      purposeCount: 0,
    };
  }
}

// Fetch recent activity from the server
async function getRecentActivity(): Promise<RecentActivity[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activities/recent`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return []; // Return empty array if endpoint doesn't exist yet
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// Fetch system status from the server
async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system status');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching system status:', error);
    return {
      database: false,
      api: false,
      websocket: false,
      lastChecked: new Date().toISOString(),
    };
  }
}

// Fetch trend data for analytics
async function getTrendData(): Promise<TrendData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats/trends`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trend data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return {
      productGrowth: 0,
      brandGrowth: 0,
      categoryGrowth: 0,
      purposeGrowth: 0,
    };
  }
}

export default async function DashboardPage() {
  // Fetch all data in parallel for better performance
  const [stats, systemStatus, trendData] = await Promise.all([
    getStats(),
    getSystemStatus(),
    getTrendData(),
  ]);

  // Fetch recent activity separately since it might not be implemented yet
  const recentActivity = await getRecentActivity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Welcome to your product management dashboard
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Quick Add Product
            </Link>
          </Button>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Products"
            value={stats.productCount}
            icon={Package}
            gradient="from-blue-500 to-cyan-500"
            trend={trendData.productGrowth}
          />
          <StatCard
            title="Total Brands"
            value={stats.brandCount}
            icon={Library}
            gradient="from-emerald-500 to-teal-500"
            trend={trendData.brandGrowth}
          />
          <StatCard
            title="Total Categories"
            value={stats.categoryCount}
            icon={Tag}
            gradient="from-violet-500 to-purple-500"
            trend={trendData.categoryGrowth}
          />
          <StatCard
            title="Total Purposes"
            value={stats.purposeCount}
            icon={Goal}
            gradient="from-amber-500 to-orange-500"
            trend={trendData.purposeGrowth}
          />
        </div>

        {/* Quick Actions & System Status */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Action Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">
                  Quick Actions
                </h2>
                <div className={`w-2 h-2 rounded-full ${systemStatus.api ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ActionCard
                  title="Add New Product"
                  description="Create a new product and add it to the queue"
                  href="/products"
                  icon={Package}
                  variant="primary"
                />
                <ActionCard
                  title="Manage Brands"
                  description="Add or edit product brands"
                  href="/brands"
                  icon={Library}
                  variant="secondary"
                />
                <ActionCard
                  title="View All Products"
                  description="Browse and manage all products"
                  href="/products"
                  icon={Package}
                  variant="secondary"
                />
                <ActionCard
                  title="System Settings"
                  description="Database configuration and system health"
                  href="/settings"
                  icon={Settings}
                  variant="secondary"
                />
              </div>
            </div>
          </div>

          {/* System Status Sidebar */}
          <div className="space-y-6">
            <SystemStatusCard status={systemStatus} />
            <RecentActivityCard activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced StatCard Component with Real Data
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  trend: number;
}

function StatCard({ title, value, icon: Icon, gradient, trend }: StatCardProps) {
  const isPositive = trend >= 0;
  const trendText = isPositive ? `+${trend}%` : `${trend}%`;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-semibold text-slate-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold text-slate-800">{value.toLocaleString()}</div>
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isPositive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${isPositive ? '' : 'rotate-180'}`} />
            {trendText}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {isPositive ? 'Growth this month' : 'Decrease this month'}
        </p>
      </CardContent>
    </Card>
  );
}

// Enhanced ActionCard Component
interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  variant?: 'primary' | 'secondary';
}

function ActionCard({ title, description, href, icon: Icon, variant = 'primary' }: ActionCardProps) {
  const variantStyles = {
    primary: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    secondary: "bg-slate-50 border-slate-200 hover:bg-slate-100"
  };

  return (
    <Card className={`border-2 ${variantStyles[variant]} transition-all duration-300 hover:scale-105 cursor-pointer group`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${variant === 'primary' ? 'bg-blue-500' : 'bg-slate-500'
            } group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 mb-4">{description}</p>
            <Button
              variant={variant === 'primary' ? "default" : "outline"}
              className="w-fit group/btn"
              asChild
            >
              <Link href={href}>

                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// System Status Card Component
interface SystemStatusCardProps {
  status: SystemStatus;
}

function SystemStatusCard({ status }: SystemStatusCardProps) {
  const statusItems = [
    { name: 'Database', status: status.database, icon: Database },
    { name: 'API Server', status: status.api, icon: Activity },
    { name: 'WebSocket', status: status.websocket, icon: Users },
  ];

  return (
    <Card className="border-l-4 border-l-green-500 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <Activity className="h-5 w-5 text-green-500" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusItems.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.status ? 'text-green-500' : 'text-red-500'
                }`} />
              <span className="text-sm text-slate-600">{item.name}</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}>
              {item.status ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">
            Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              View Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Card Component
interface RecentActivityCardProps {
  activities: RecentActivity[];
}

function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return Plus;
      case 'update': return Settings;
      case 'delete': return Activity;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-3 w-3 text-slate-500" />
                      <p className="text-sm font-medium text-slate-700 capitalize">
                        {activity.type} {activity.entity}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                    {activity.brandName && (
                      <p className="text-xs text-slate-400 mt-1">Brand: {activity.brandName}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
              <p className="text-xs text-slate-400 mt-1">Activities will appear here</p>
            </div>
          )}
        </div>
        {activities.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <Button variant="ghost" className="w-full text-sm" asChild>
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}