// routes/index.ts
import { Router } from "express";
import { prisma } from "../lib/db";
import { createSlug } from "../lib/utils";
import {
  createProduct,
  updateProductName,
} from "../controllers/productController";
import {
  getDashboardStats,
  getDbStatus,
  updateDbUrl,
} from "../controllers/settingsController";
import { broadcastTaskStatus } from "../services/websocket";
import { upload } from "../lib/multer";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Task persistence setup
const TASKS_FILE = path.join(process.cwd(), "data", "tasks.json");

// Ensure tasks directory and file exist
const ensureTasksFile = async () => {
  const dir = path.dirname(TASKS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, JSON.stringify([]));
  }
};

// Read tasks from file
const readTasks = async (): Promise<any[]> => {
  await ensureTasksFile();
  const data = await fs.readFile(TASKS_FILE, "utf-8");
  return JSON.parse(data);
};

// Write tasks to file
const writeTasks = async (tasks: any[]) => {
  await ensureTasksFile();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
};

// === Task Persistence Routes ===

// GET /api/tasks - Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await readTasks();
    // Sort by creation date, newest first
    tasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(tasks);
  } catch (error: any) {
    console.error("Error reading tasks:", error);
    res.status(500).json({ error: "Failed to read tasks" });
  }
});

// POST /api/tasks - Create a new task
router.post("/tasks", async (req, res) => {
  try {
    const task = req.body;
    const tasks = await readTasks();

    // Ensure task has required fields
    const newTask = {
      id: task.id || uuidv4(),
      type: task.type,
      payload: task.payload,
      status: task.status || "queued",
      entity: task.entity || task.type?.split("-")[1],
      createdAt: task.createdAt || Date.now(),
      updatedAt: task.updatedAt || Date.now(),
      ...(task.error && { error: task.error }),
      ...(task.result && { result: task.result }),
    };

    // Add to beginning of array (newest first)
    tasks.unshift(newTask);

    // Keep only last 1000 tasks to prevent file from growing too large
    const trimmedTasks = tasks.slice(0, 1000);
    await writeTasks(trimmedTasks);

    console.log("💾 Task persisted:", newTask.id, newTask.type);
    res.status(201).json(newTask);
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PATCH /api/tasks/:id - Update a task
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    await writeTasks(tasks);
    console.log("💾 Task updated:", id, updates.status);
    res.json(tasks[taskIndex]);
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// GET /api/tasks/stats - Get task statistics
router.get("/tasks/stats", async (req, res) => {
  try {
    const tasks = await readTasks();

    const stats = {
      total: tasks.length,
      queued: tasks.filter((t) => t.status === "queued").length,
      processing: tasks.filter((t) => t.status === "processing").length,
      success: tasks.filter((t) => t.status === "success").length,
      error: tasks.filter((t) => t.status === "error").length,
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Error getting task stats:", error);
    res.status(500).json({ error: "Failed to get task statistics" });
  }
});

// DELETE /api/tasks/completed - Clear completed tasks
router.delete("/tasks/completed", async (req, res) => {
  try {
    const tasks = await readTasks();
    const activeTasks = tasks.filter(
      (task) => task.status === "queued" || task.status === "processing"
    );

    await writeTasks(activeTasks);

    res.json({
      message: "Completed tasks cleared",
      remaining: activeTasks.length,
    });
  } catch (error: any) {
    console.error("Error clearing completed tasks:", error);
    res.status(500).json({ error: "Failed to clear completed tasks" });
  }
});

// === Product Routes ===
router.post("/products", upload.single("image"), createProduct);
router.put("/products/:id/name", updateProductName);

// GET /api/products
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: true,
        category: true,
        purpose: true,
        images: {
          take: 1,
        },
      },
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// === Brand Routes ===
router.post("/brands", async (req, res) => {
  const { name, taskId } = req.body;
  if (!name || !taskId) {
    return res.status(400).json({ error: "Missing name or taskId" });
  }

  broadcastTaskStatus(taskId, "processing");
  try {
    const newBrand = await prisma.$transaction(async (tx) => {
      const existing = await tx.brand.findUnique({ where: { name } });
      if (existing) throw new Error("Brand name already exists.");
      return tx.brand.create({
        data: { id: createSlug(name), name: name },
      });
    });

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "success",
            result: newBrand,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update task in backend:", error);
    }

    broadcastTaskStatus(taskId, "success", undefined, newBrand);
    res.status(201).json(newBrand);
  } catch (error: any) {
    const isConflict = error.message.includes("already exists");

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "error",
            error: isConflict ? error.message : "Database error",
          }),
        }
      );
    } catch (updateError) {
      console.error("Failed to update task in backend:", updateError);
    }

    broadcastTaskStatus(
      taskId,
      "error",
      isConflict ? error.message : "Database error"
    );
    res.status(isConflict ? 409 : 500).json({ error: error.message });
  }
});

router.get("/brands", async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  res.json(brands);
});

// === Category Routes ===
router.post("/categories", async (req, res) => {
  const { name, taskId } = req.body;
  if (!name || !taskId) {
    return res.status(400).json({ error: "Missing name or taskId" });
  }

  broadcastTaskStatus(taskId, "processing");
  try {
    const newCategory = await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({ where: { name } });
      if (existing) throw new Error("Category name already exists.");
      return tx.category.create({
        data: { id: createSlug(name), name: name },
      });
    });

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "success",
            result: newCategory,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update task in backend:", error);
    }

    broadcastTaskStatus(taskId, "success", undefined, newCategory);
    res.status(201).json(newCategory);
  } catch (error: any) {
    const isConflict = error.message.includes("already exists");

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "error",
            error: isConflict ? error.message : "Database error",
          }),
        }
      );
    } catch (updateError) {
      console.error("Failed to update task in backend:", updateError);
    }

    broadcastTaskStatus(
      taskId,
      "error",
      isConflict ? error.message : "Database error"
    );
    res.status(isConflict ? 409 : 500).json({ error: error.message });
  }
});

router.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

// === Purpose Routes ===
router.post("/purposes", async (req, res) => {
  const { name, taskId } = req.body;
  if (!name || !taskId) {
    return res.status(400).json({ error: "Missing name or taskId" });
  }

  broadcastTaskStatus(taskId, "processing");
  try {
    const newPurpose = await prisma.$transaction(async (tx) => {
      const existing = await tx.purpose.findUnique({ where: { name } });
      if (existing) throw new Error("Purpose name already exists.");
      return tx.purpose.create({
        data: { id: createSlug(name), name: name },
      });
    });

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "success",
            result: newPurpose,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update task in backend:", error);
    }

    broadcastTaskStatus(taskId, "success", undefined, newPurpose);
    res.status(201).json(newPurpose);
  } catch (error: any) {
    const isConflict = error.message.includes("already exists");

    // Update task in backend storage
    try {
      await fetch(
        `http://localhost:${process.env.PORT || 4000}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "error",
            error: isConflict ? error.message : "Database error",
          }),
        }
      );
    } catch (updateError) {
      console.error("Failed to update task in backend:", updateError);
    }

    broadcastTaskStatus(
      taskId,
      "error",
      isConflict ? error.message : "Database error"
    );
    res.status(isConflict ? 409 : 500).json({ error: error.message });
  }
});

router.get("/purposes", async (req, res) => {
  const purposes = await prisma.purpose.findMany({ orderBy: { name: "asc" } });
  res.json(purposes);
});

// === Dashboard & Analytics Routes ===

// GET /api/activities/recent
router.get("/activities/recent", async (req, res) => {
  try {
    // Get recent tasks from persistence file
    const tasks = await readTasks();
    const recentTasks = tasks.slice(0, 10); // Get 10 most recent tasks

    const activities = recentTasks.map((task) => ({
      id: task.id,
      type: task.type.split("-")[0], // 'create', 'update', etc.
      entity: task.entity || task.type.split("-")[1],
      status: task.status,
      description: `${task.type.split("-")[0]} ${
        task.entity || task.type.split("-")[1]
      }: ${task.payload?.name || "Unknown"}`,
      createdAt: new Date(task.createdAt).toISOString(),
      updatedAt: new Date(task.updatedAt).toISOString(),
    }));

    res.json(activities);
  } catch (error: any) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
});

// GET /api/health
router.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const database = true;

    // Test task file access
    await readTasks();
    const tasksAccess = true;

    res.json({
      database,
      api: true,
      websocket: true,
      tasksStorage: tasksAccess,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    res.json({
      database: false,
      api: true,
      websocket: false,
      tasksStorage: false,
      lastChecked: new Date().toISOString(),
    });
  }
});

// GET /api/stats/trends
router.get("/stats/trends", async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get current counts
    const [currentProducts, currentBrands, currentCategories, currentPurposes] =
      await Promise.all([
        prisma.product.count(),
        prisma.brand.count(),
        prisma.category.count(),
        prisma.purpose.count(),
      ]);

    // Get counts from one month ago
    const [
      previousProducts,
      previousBrands,
      previousCategories,
      previousPurposes,
    ] = await Promise.all([
      prisma.product.count({
        where: {
          createdAt: { lt: oneMonthAgo },
        },
      }),
      prisma.brand.count({
        where: {
          createdAt: { lt: oneMonthAgo },
        },
      }),
      prisma.category.count({
        where: {
          createdAt: { lt: oneMonthAgo },
        },
      }),
      prisma.purpose.count({
        where: {
          createdAt: { lt: oneMonthAgo },
        },
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
    console.error("Error fetching trends:", error);
    res.status(500).json({
      productGrowth: 0,
      brandGrowth: 0,
      categoryGrowth: 0,
      purposeGrowth: 0,
    });
  }
});

// === Settings Routes ===
router.post("/settings/db-url", updateDbUrl);
router.get("/settings/db-status", getDbStatus);
router.get("/stats", getDashboardStats);

export default router;
