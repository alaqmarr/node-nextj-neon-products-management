import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { broadcastTaskStatus } from '../services/websocket';
import { uploadToCloudinary } from '../lib/cloudinary';
import { createSlug } from '../lib/utils';

// Helper for Prisma unique constraint errors
const isUniqueConstraintError = (e: any): boolean =>
  e.code === 'P2002';

// 1. Create Product
export const createProduct = async (req: Request, res: Response) => {
  const { name, categoryId, brandId, purposeId, taskId } = req.body;
  const imageFile = req.file;

  if (!name || !taskId || !imageFile) {
    return res.status(400).json({ error: 'Missing name, taskId, or image' });
  }

  broadcastTaskStatus(taskId, 'processing');

  try {
    // Step 1: Upload image to Cloudinary (as per your rule)
    const uploadResult = await uploadToCloudinary(imageFile.buffer, 'products');

    // Step 2: Run database transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const slug = createSlug(name);

      // Check for unique product name (and slug/id)
      const existingName = await tx.product.findUnique({ where: { name } });
      if (existingName) throw new Error('Product name must be unique.');

      const existingId = await tx.product.findUnique({ where: { id: slug } });
      if (existingId) throw new Error('Product slug (from name) already exists.');

      // Create Product
      const product = await tx.product.create({
        data: {
          id: slug,
          name: name,
          categoryId: categoryId || null,
          brandId: brandId || null,
          purposeId: purposeId || null,
        },
      });

      // Create and link Image
      await tx.image.create({
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          productId: product.id,
        },
      });

      return product;
    });

    broadcastTaskStatus(taskId, 'success', undefined, newProduct);
    res.status(201).json(newProduct);
  } catch (error: any) {
    const errorMsg = isUniqueConstraintError(error)
      ? 'Product name or slug already exists.'
      : error.message || 'Failed to create product.';
      
    broadcastTaskStatus(taskId, 'error', errorMsg);
    res.status(isUniqueConstraintError(error) ? 409 : 500).json({ error: errorMsg });
  }
};

// 2. Update Product Name (The complex "delete and recreate" rule)
export const updateProductName = async (req: Request, res: Response) => {
  const { id: oldProductId } = req.params;
  const { newName, taskId } = req.body;

  if (!newName || !taskId) {
    return res.status(400).json({ error: 'Missing newName or taskId' });
  }

  broadcastTaskStatus(taskId, 'processing');
  const newSlug = createSlug(newName);

  try {
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Find the old product
      const oldProduct = await tx.product.findUnique({
        where: { id: oldProductId },
      });
      if (!oldProduct) throw new Error('Product not found.');
      if (oldProduct.name === newName) return oldProduct; // No change

      // 2. Check if new name/slug is unique
      const existing = await tx.product.findFirst({
        where: { OR: [{ name: newName }, { id: newSlug }] },
      });
      if (existing) throw new Error('New product name or slug already exists.');

      // 3. Create the new product with the old data + new name/slug
      const newProduct = await tx.product.create({
        data: {
          ...oldProduct,
          id: newSlug, // New slug/id
          name: newName, // New name
          createdAt: oldProduct.createdAt, // Preserve original creation date
          updatedAt: new Date(), // Set new update date
        },
      });

      // 4. Re-link all related images to the new product ID
      // (This works because of `onDelete: Cascade` on the Image.productId)
      await tx.image.updateMany({
        where: { productId: oldProductId },
        data: { productId: newProduct.id },
      });
      
      // 5. Delete the old product
      // (This is safe now as relations are moved)
      await tx.product.delete({
        where: { id: oldProductId },
      });

      return newProduct;
    });

    broadcastTaskStatus(taskId, 'success', undefined, updatedProduct);
    res.status(200).json(updatedProduct);

  } catch (error: any) {
     const errorMsg = isUniqueConstraintError(error)
      ? 'New product name or slug already exists.'
      : error.message || 'Failed to update product name.';
      
    broadcastTaskStatus(taskId, 'error', errorMsg);
    res.status(isUniqueConstraintError(error) ? 409 : 500).json({ error: errorMsg });
  }
};