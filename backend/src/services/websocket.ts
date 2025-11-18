import { WebSocket, WebSocketServer } from 'ws';

let wss: WebSocketServer;

export const initWebSocketServer = (server: any) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  console.log('WebSocket server initialized.');
};

/**
 * Broadcasts a message to all connected WebSocket clients.
 */
export const broadcast = (data: any) => {
  if (!wss) {
    console.error('WebSocket server not initialized.');
    return;
  }

  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

/**
 * Helper to broadcast task status updates.
 */
export const broadcastTaskStatus = (
  taskId: string,
  status: 'processing' | 'success' | 'error',
  error?: string,
  data?: any
) => {
  broadcast({
    type: 'task-status-update',
    payload: {
      taskId,
      status,
      error,
      data, // e.g., the created product
    },
  });
};