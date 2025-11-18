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
  
  // Form state
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Linked entity state
  const [brandId, setBrandId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [purposeId, setPurposeId] = useState<string | undefined>();

  // Data for dropdowns
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        useRouter().refresh();
      }
    };
    fetchData();
  }, []);

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
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageFile) {
      alert('Please provide a name and an image.');
      return;
    }

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
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>New Product Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultra-Soft Cotton T-Shirt"
              required
            />
          </div>

          {/* Image */}
          <div>
            <Label htmlFor="image">Product Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          {preview && (
            <div>
              <Label>Image Preview</Label>
              <img
                src={preview}
                alt="Image preview"
                className="mt-2 rounded-md object-cover w-full h-48"
              />
            </div>
          )}

          {/* Brand Select */}
          <div>
            <Label htmlFor="brand">Brand (Optional)</Label>
            <Select onValueChange={setBrandId} value={brandId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Select */}
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Select onValueChange={setCategoryId} value={categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purpose Select */}
          <div>
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <Select onValueChange={setPurposeId} value={purposeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a purpose" />
              </SelectTrigger>
              <SelectContent>
                {purposes.map((pur) => (
                  <SelectItem key={pur.id} value={pur.id}>
                    {pur.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={!name || !imageFile}>
            Add to Queue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}