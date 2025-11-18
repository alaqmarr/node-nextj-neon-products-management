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
import Image from 'next/image';

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
}

export default function ManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Entities</h1>
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="purposes">Purposes ({purposes.length})</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <ProductsTable products={products} />
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <SimpleTable data={brands} title="Brand" />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <SimpleTable data={categories} title="Category" />
        </TabsContent>

        {/* Purposes Tab */}
        <TabsContent value="purposes">
          <SimpleTable data={purposes} title="Purpose" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Reusable Table Components ---

function ProductsTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Purpose</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              {product.images[0]?.url ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  width={60}
                  height={60}
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                  No img
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant={product.isArchived ? 'outline' : 'default'}>
                {product.isArchived ? 'Archived' : product.status}
              </Badge>
            </TableCell>
            <TableCell>{product.brand?.name || 'N/A'}</TableCell>
            <TableCell>{product.category?.name || 'N/A'}</TableCell>
            <TableCell>{product.purpose?.name || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SimpleTable({ data, title }: { data: { id: string, name: string }[], title: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{title} Name</TableHead>
          <TableHead>Slug / ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="font-mono text-xs">{item.id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}