// context/WebSocketProvider.tsx
'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { createContext, useContext, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';

const WebSocketContext = createContext<{ isConnected: boolean }>({ 
  isConnected: false 
});

export const useWebSocketContext = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const _ws = useWebSocket() as any;
  const wsRef = _ws?.wsRef ?? ({ current: null } as React.MutableRefObject<WebSocket | null>);
  const { wsConnected } = useTaskStore();

  // Optional: Send periodic health checks
  useEffect(() => {
    if (!wsConnected || !wsRef.current) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          type: 'health-check',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [wsConnected, wsRef]);

  return (
    <WebSocketContext.Provider value={{ isConnected: wsConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};