'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import toast from 'react-hot-toast';

const WebSocketContext = createContext<WebSocket | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const handleUpdate = useTaskStore(
    (state) => state._handleWebSocketUpdate
  );

  useEffect(() => {
    // Connect to the WebSocket server
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      toast.success('Real-time connection established.');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Listen for the specific message type from the backend
        if (message.type === 'task-status-update') {
          const { taskId, status, error } = message.payload;
          
          // Update the Zustand store
          handleUpdate({ taskId, status, error });

          // Show toasts
          if (status === 'success') {
            toast.success(`Task ${taskId.split('-')[0]} completed.`);
          } else if (status === 'error') {
            toast.error(`Task failed: ${error}`);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      toast.error('Real-time connection lost.');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Real-time connection error.');
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [handleUpdate]);

  return (
    <WebSocketContext.Provider value={wsRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};