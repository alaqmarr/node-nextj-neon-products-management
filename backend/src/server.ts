import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initWebSocketServer } from './services/websocket';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const server = createServer(app); // Create HTTP server
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Allow requests from Next.js app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Product Management API is running.');
});

// Initialize WebSocket Server
initWebSocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});