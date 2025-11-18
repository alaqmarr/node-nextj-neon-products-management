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
} from 'lucide-react';
import { api } from '../lib/axios'; // Use the shared axios instance

interface DashboardStats {
  productCount: number;
  brandCount: number;
  categoryCount: number;
  purposeCount: number;
}

// Fetch data on the server
async function getStats(): Promise<DashboardStats> {
  try {
    // We use the full URL here because this fetch runs on the server
    // or during build, and doesn't know about 'localhost' implicitly.
    // Using the axios instance's baseURL is safer.
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
      cache: 'no-store', // Always fetch fresh data for a dashboard
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return zeros on error so the page doesn't crash
    return {
      productCount: 0,
      brandCount: 0,
      categoryCount: 0,
      purposeCount: 0,
    };
  }
}

// This is an async Server Component
export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* 1. Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.productCount}
          icon={Package}
        />
        <StatCard
          title="Total Brands"
          value={stats.brandCount}
          icon={Library}
        />
        <StatCard
          title="Total Categories"
          value={stats.categoryCount}
          icon={Tag}
        />
        <StatCard
          title="Total Purposes"
          value={stats.purposeCount}
          icon={Goal}
        />
      </div>

      {/* 2. Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Add New Product"
            description="Create a new product and add it to the queue."
            href="/products"
            icon={Package}
          />
          <ActionCard
            title="Manage Entities"
            description="Add or edit brands, categories, and purposes."
            href="/brands"
            icon={ClipboardList}
          />
          <ActionCard
            title="View Settings"
            description="Check database health and connection status."
            href="/settings"
            icon={Goal}
          />
        </div>
      </div>
    </div>
  );
}

// --- Reusable Sub-Components ---

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          Total items in database
        </p>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

function ActionCard({ title, description, href, icon: Icon }: ActionCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button asChild>
          <Link href={href}>
            Go to Page <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}