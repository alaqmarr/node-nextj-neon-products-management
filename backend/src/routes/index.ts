import { Router } from 'express';
import { prisma } from '../lib/db';
import { createSlug } from '../lib/utils';
import { createProduct, updateProductName } from '../controllers/productController';
import { getDashboardStats, getDbStatus, updateDbUrl } from '../controllers/settingsController';
import { broadcastTaskStatus } from '../services/websocket';
import { upload } from '../lib/multer';

const router = Router();

// === Product Routes ===
router.post('/products', upload.single('image'), createProduct);
router.put('/products/:id/name', updateProductName);
// ADD THIS NEW ROUTE
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true,    // Include the brand data
        category: true, // Include the category data
        purpose: true,  // Include the purpose data
        images: {       // Only take the first image for the preview
          take: 1,
        },
      },
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// === Brand Routes ===
router.post('/brands', async (req, res) => {
  const { name, taskId } = req.body;
  if (!name || !taskId) {
    return res.status(400).json({ error: 'Missing name or taskId' });
  }

  broadcastTaskStatus(taskId, 'processing');
  try {
    const newBrand = await prisma.$transaction(async (tx) => {
      const existing = await tx.brand.findUnique({ where: { name } });
      if (existing) throw new Error('Brand name already exists.');
      return tx.brand.create({
        data: { id: createSlug(name), name: name },
      });
    });
    broadcastTaskStatus(taskId, 'success', undefined, newBrand);
    res.status(201).json(newBrand);
  } catch (error: any) {
    const isConflict = error.message.includes('already exists');
    broadcastTaskStatus(taskId, 'error', isConflict ? error.message : 'Database error');
    res.status(isConflict ? 409 : 500).json({ error: error.message });
  }
});

router.get('/brands', async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json(brands);
});

// === Category Routes ===
router.post('/categories', async (req, res) => {
  const { name, taskId } = req.body;
  if (!name || !taskId) {
    return res.status(400).json({ error: 'Missing name or taskId' });
  }

  broadcastTaskStatus(taskId, 'processing');
  try {
    const newCategory = await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({ where: { name } });
      if (existing) throw new Error('Category name already exists.');
      return tx.category.create({
        data: { id: createSlug(name), name: name },
      });
    });
    broadcastTaskStatus(taskId, 'success', undefined, newCategory);
    res.status(201).json(newCategory);
  } catch (error: any) {
    const isConflict = error.message.includes('already exists');
    broadcastTaskStatus(taskId, 'error', isConflict ? error.message : 'Database error');
    res.status(isConflict ? 409 : 500).json({ error: error.message });
  }
});

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

// === Purpose Routes ===
router.post('/purposes', async (req, res) => {
    const { name, taskId } = req.body;
    if (!name || !taskId) {
      return res.status(400).json({ error: 'Missing name or taskId' });
    }
  
    broadcastTaskStatus(taskId, 'processing');
    try {
      const newPurpose = await prisma.$transaction(async (tx) => {
        const existing = await tx.purpose.findUnique({ where: { name } });
        if (existing) throw new Error('Purpose name already exists.');
        return tx.purpose.create({
          data: { id: createSlug(name), name: name },
        });
      });
      broadcastTaskStatus(taskId, 'success', undefined, newPurpose);
      res.status(201).json(newPurpose);
    } catch (error: any) {
      const isConflict = error.message.includes('already exists');
      broadcastTaskStatus(taskId, 'error', isConflict ? error.message : 'Database error');
      res.status(isConflict ? 409 : 500).json({ error: error.message });
    }
  });
  
  router.get('/purposes', async (req, res) => {
    const purposes = await prisma.purpose.findMany({ orderBy: { name: 'asc' } });
    res.json(purposes);
  });

// === Settings Routes ===
router.post('/settings/db-url', updateDbUrl);
router.get('/settings/db-status', getDbStatus);
router.post('/settings/db-url', updateDbUrl);
router.get('/settings/db-status', getDbStatus);
router.get('/stats', getDashboardStats); // <-- Add this route

export default router;