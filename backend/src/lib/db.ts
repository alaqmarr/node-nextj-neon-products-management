import { PrismaClient } from '@prisma/client';

// Initialize with the URL from .env
let prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Disconnects the current Prisma client, creates a new one with the
 * new database URL, and connects to it.
 */
export const refreshPrismaClient = async (newDbUrl: string) => {
  try {
    // Disconnect old client
    await prisma.$disconnect();

    // Create new client with the new URL
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: newDbUrl,
        },
      },
    });

    // Test the new connection
    await prisma.$connect();
    console.log('Prisma client refreshed with new DB URL.');
    
    // Update the env for any future (less likely) restarts
    process.env.DATABASE_URL = newDbUrl; 
    
  } catch (error) {
    console.error('Failed to refresh Prisma client:', error);
    // Revert to old client if connection fails? For now, we'll just throw.
    throw new Error('Failed to connect to the new database URL.');
  }
};

// Export the (potentially dynamic) prisma instance
export { prisma };