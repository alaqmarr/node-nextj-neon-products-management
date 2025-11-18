'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Package,
  Library,
  Tag,
  Goal,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  Image as ImageIcon,
  Loader2,
  Database,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// --- Data Types ---
interface Image {
  id: string;
  url: string;
}
interface Brand {
  id: string;
  name: string;
}
interface Category {
  id: string;
  name: string;
}
interface Purpose {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  status: string;
  isArchived: boolean;
  images: Image[];
  brand: Brand | null;
  category: Category | null;
  purpose: Purpose | null;
  createdAt: string;
  updatedAt: string;
}

export default function ManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [prodRes, brandRes, catRes, purRes] = await Promise.all([
        api.get('/products'),
        api.get('/brands'),
        api.get('/categories'),
        api.get('/purposes'),
      ]);
      setProducts(prodRes.data);
      setBrands(brandRes.data);
      setCategories(catRes.data);
      setPurposes(purRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Loading Data</h3>
            <p className="text-slate-500">Fetching your product management data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Manage Entities
            </h1>
            <p className="text-slate-600 mt-2">
              View and manage all products, brands, categories, and purposes
            </p>
          </div>
          <Button 
            onClick={fetchData} 
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={products.length}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Brands"
            value={brands.length}
            icon={Library}
            color="green"
          />
          <StatCard
            title="Categories"
            value={categories.length}
            icon={Tag}
            color="purple"
          />
          <StatCard
            title="Purposes"
            value={purposes.length}
            icon={Goal}
            color="amber"
          />
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">Entity Management</CardTitle>
                <CardDescription>
                  Browse and manage all system entities in one place
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-14">
                <TabsTrigger 
                  value="products" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent h-14 px-6"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Products ({products.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="brands" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent h-14 px-6"
                >
                  <Library className="h-4 w-4 mr-2" />
                  Brands ({brands.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent h-14 px-6"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Categories ({categories.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="purposes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent h-14 px-6"
                >
                  <Goal className="h-4 w-4 mr-2" />
                  Purposes ({purposes.length})
                </TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products" className="m-0">
                <ProductsTable products={searchTerm ? filteredProducts : products} />
              </TabsContent>

              {/* Brands Tab */}
              <TabsContent value="brands" className="m-0">
                <SimpleTable 
                  data={brands} 
                  title="Brand" 
                  icon={Library}
                  color="green"
                />
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="m-0">
                <SimpleTable 
                  data={categories} 
                  title="Category" 
                  icon={Tag}
                  color="purple"
                />
              </TabsContent>

              {/* Purposes Tab */}
              <TabsContent value="purposes" className="m-0">
                <SimpleTable 
                  data={purposes} 
                  title="Purpose" 
                  icon={Goal}
                  color="amber"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Reusable Table Components ---

function ProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead className="min-w-[200px]">Product Details</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group">
              <TableCell>
                <div className="flex items-center justify-center">
                  {product.images[0]?.url ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Created {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={product.isArchived ? "outline" : "default"}
                  className={cn(
                    "capitalize",
                    product.isArchived && "bg-slate-100 text-slate-700 border-slate-200",
                    !product.isArchived && product.status === 'active' && "bg-green-100 text-green-700 border-green-200",
                    !product.isArchived && product.status === 'draft' && "bg-amber-100 text-amber-700 border-amber-200"
                  )}
                >
                  {product.isArchived ? 'Archived' : product.status}
                </Badge>
              </TableCell>
              <TableCell>
                {product.brand ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{product.brand.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {product.category ? (
                  <span className="font-medium">{product.category.name}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {product.purpose ? (
                  <span className="font-medium">{product.purpose.name}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No products found</h3>
          <p className="text-slate-500 mt-1">Get started by creating your first product</p>
        </div>
      )}
    </div>
  );
}

function SimpleTable({ 
  data, 
  title, 
  icon: Icon,
  color 
}: { 
  data: { id: string, name: string }[], 
  title: string,
  icon: React.ElementType,
  color: string
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 border-green-200',
    purple: 'text-purple-600 bg-purple-100 border-purple-200',
    amber: 'text-amber-600 bg-amber-100 border-amber-200',
    blue: 'text-blue-600 bg-blue-100 border-blue-200',
  };

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="min-w-[200px]">{title} Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg border", colorClasses[color as keyof typeof colorClasses])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{item.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded border font-mono text-slate-600">
                  {item.id}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-12">
          <Icon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No {title.toLowerCase()}s found</h3>
          <p className="text-slate-500 mt-1">Create your first {title.toLowerCase()} to get started</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-violet-500',
    amber: 'from-amber-500 to-orange-500',
  };

  return (
    <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl bg-gradient-to-r", colorClasses[color as keyof typeof colorClasses])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}