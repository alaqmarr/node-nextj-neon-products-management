'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Image as ImageIcon, 
  Package, 
  Library, 
  Tag, 
  Goal, 
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for fetched data
interface Brand { id: string; name: string; }
interface Category { id: string; name: string; }
interface Purpose { id: string; name: string; }

interface CreateProductFormProps {
  pastedImage: File | null;
  onFormSubmit: () => void;
}

export function CreateProductForm({
  pastedImage,
  onFormSubmit,
}: CreateProductFormProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linked entity state
  const [brandId, setBrandId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [purposeId, setPurposeId] = useState<string | undefined>();

  // Data for dropdowns
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [brandsRes, categoriesRes, purposesRes] = await Promise.all([
          api.get('/brands'),
          api.get('/categories'),
          api.get('/purposes'),
        ]);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
        setPurposes(purposesRes.data);
      } catch (error) {
        console.error("Failed to fetch entities", error);
        router.refresh();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Effect for pasted image
  useEffect(() => {
    if (pastedImage) {
      setImageFile(pastedImage);
    }
  }, [pastedImage]);

  // Effect for image preview
  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }
      setImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please drop an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageFile) {
      alert('Please provide a name and an image.');
      return;
    }

    setIsSubmitting(true);

    try {
      addTask('create-product', {
        name,
        imageFile,
        brandId,
        categoryId,
        purposeId,
      });

      // Clear form
      setName('');
      setImageFile(null);
      setPreview(null);
      setBrandId(brandId);
      setCategoryId(categoryId);
      setPurposeId(purposeId);
      onFormSubmit();
    } catch (error) {
      console.error('Failed to submit product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRequiredFields = name && imageFile;

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/20 dark:from-gray-900 dark:to-gray-800/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Create New Product
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add a new product to your inventory
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Product Name *
            </Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ultra-Soft Cotton T-Shirt"
                required
                className="pl-10 h-12 text-lg border-slate-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Product Image *
            </Label>
            
            {!preview ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-gray-800/50"
                onClick={() => document.getElementById('image')?.click()}
              >
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Drop your image here or click to browse
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports: JPG, PNG, WebP • Max: 5MB
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  💡 Tip: You can also paste (Ctrl+V) an image from clipboard
                </p>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={preview}
                  alt="Image preview"
                  className="w-full h-64 rounded-xl object-cover border-2 border-slate-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {imageFile?.name}
                </div>
              </div>
            )}
          </div>

          {/* Entity Selection Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Brand Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Library className="h-4 w-4 text-blue-500" />
                Brand
              </Label>
              <Select onValueChange={setBrandId} value={brandId}>
                <SelectTrigger className={cn(
                  "h-12 border-slate-300 dark:border-gray-600",
                  brandId && "border-blue-300 dark:border-blue-500"
                )}>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                Category
              </Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger className={cn(
                  "h-12 border-slate-300 dark:border-gray-600",
                  categoryId && "border-green-300 dark:border-green-500"
                )}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Goal className="h-4 w-4 text-purple-500" />
                Purpose
              </Label>
              <Select onValueChange={setPurposeId} value={purposeId}>
                <SelectTrigger className={cn(
                  "h-12 border-slate-300 dark:border-gray-600",
                  purposeId && "border-purple-300 dark:border-purple-500"
                )}>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    purposes.map((pur) => (
                      <SelectItem key={pur.id} value={pur.id}>
                        {pur.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!hasRequiredFields || isSubmitting}
              className={cn(
                "flex-1 h-12 text-lg font-semibold transition-all duration-200",
                hasRequiredFields 
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25" 
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding to Queue...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Task Queue
                </>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The product will be added to the task queue and processed in the background
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}