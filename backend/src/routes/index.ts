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

  // Add these routes to your existing server code

// === Dashboard & Analytics Routes ===

// GET /api/activities/recent
router.get('/activities/recent', async (req, res) => {
  try {
    // Since you don't have an Activity model yet, we'll create a temporary solution
    // that tracks activities from your existing models
    const recentProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        brand: { select: { name: true } },
      },
    });

    const activities = recentProducts.map((product, index) => ({
      id: `activity-${product.id}`,
      type: 'create',
      entity: 'product',
      status: 'success',
      description: `Created product: ${product.name}`,
      createdAt: product.createdAt.toISOString(),
      brandName: product.brand?.name,
    }));

    res.json(activities);
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const database = true;

    res.json({
      database,
      api: true,
      websocket: true, // Assuming WebSocket is running
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.json({
      database: false,
      api: true,
      websocket: false,
      lastChecked: new Date().toISOString(),
    });
  }
});

// GET /api/stats/trends
router.get('/stats/trends', async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get current counts
    const [currentProducts, currentBrands, currentCategories, currentPurposes] = await Promise.all([
      prisma.product.count(),
      prisma.brand.count(),
      prisma.category.count(),
      prisma.purpose.count(),
    ]);

    // Get counts from one month ago
    const [previousProducts, previousBrands, previousCategories, previousPurposes] = await Promise.all([
      prisma.product.count({
        where: {
          createdAt: { lt: oneMonthAgo }
        }
      }),
      prisma.brand.count({
        where: {
          createdAt: { lt: oneMonthAgo }
        }
      }),
      prisma.category.count({
        where: {
          createdAt: { lt: oneMonthAgo }
        }
      }),
      prisma.purpose.count({
        where: {
          createdAt: { lt: oneMonthAgo }
        }
      }),
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      productGrowth: calculateGrowth(currentProducts, previousProducts),
      brandGrowth: calculateGrowth(currentBrands, previousBrands),
      categoryGrowth: calculateGrowth(currentCategories, previousCategories),
      purposeGrowth: calculateGrowth(currentPurposes, previousPurposes),
    });
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      productGrowth: 0,
      brandGrowth: 0,
      categoryGrowth: 0,
      purposeGrowth: 0,
    });
  }
});

// === Settings Routes ===
router.post('/settings/db-url', updateDbUrl);
router.get('/settings/db-status', getDbStatus);
router.post('/settings/db-url', updateDbUrl);
router.get('/settings/db-status', getDbStatus);
router.get('/stats', getDashboardStats); // <-- Add this route

export default router;