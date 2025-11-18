// backend/src/lib/multer.ts
import multer from 'multer';

// Setup Multer for memory storage (to buffer for Cloudinary)
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });