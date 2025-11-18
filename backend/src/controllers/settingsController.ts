import { Request, Response } from "express";
import { prisma, refreshPrismaClient } from "../lib/db";

export const updateDbUrl = async (req: Request, res: Response) => {
  const { newUrl } = req.body;
  if (!newUrl) {
    return res.status(400).json({ error: "Missing newUrl" });
  }

  try {
    await refreshPrismaClient(newUrl);
    res
      .status(200)
      .json({ message: "Database connection refreshed successfully." });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to connect to new database.",
      details: error.message,
    });
  }
};

export const getDbStatus = async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    res.status(200).json({
      status: "healthy",
      latency: `${latency}ms`,
      dbUrl: process.env.DATABASE_URL?.split("@")[1] || "Unknown", // Hide credentials
    });
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      dbUrl: process.env.DATABASE_URL?.split("@")[1] || "Unknown",
    });
  }
};

// ... (existing getDbStatus and updateDbUrl functions)

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [productCount, brandCount, categoryCount, purposeCount] =
      await prisma.$transaction([
        prisma.product.count(),
        prisma.brand.count(),
        prisma.category.count(),
        prisma.purpose.count(),
      ]);

    res.status(200).json({
      productCount,
      brandCount,
      categoryCount,
      purposeCount,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats.',
      error: error.message,
    });
  }
};
