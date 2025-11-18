// hooks/useWebSocket.ts
import { useTaskStore } from '@/app/store/taskStore';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { 
    _handleWebSocketUpdate, 
    setWsConnected,
    // Remove _updateTaskInBackend from here since it's not used in the hook
  } = useTaskStore();

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let isConnecting = false;

    const connectWebSocket = () => {
      if (isConnecting) return;
      
      isConnecting = true;
      
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          isConnecting = false;
          setWsConnected(true);
          toast.success('Real-time connection established', { 
            icon: '🔗',
            duration: 3000 
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            
            if (data.type === 'task-status-update') {
              _handleWebSocketUpdate(data.payload);
              
              // Show toast notifications
              if (data.payload.status === 'success') {
                toast.success(`Task completed successfully`, {
                  icon: '✅',
                  duration: 4000,
                });
              } else if (data.payload.status === 'error') {
                toast.error(`Task failed: ${data.payload.error}`, {
                  duration: 5000,
                });
              }
            }
            
            if (data.type === 'task-sync') {
              console.log('🔄 Received task sync from server');
              // You can implement task synchronization logic here if needed
            }

            if (data.type === 'health-check') {
              // Respond to health check
              ws.send(JSON.stringify({ type: 'health-ack' }));
            }
            
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          isConnecting = false;
          setWsConnected(false);
          
          // Don't show toast for normal closures
          if (event.code !== 1000) {
            toast.error('Real-time connection lost. Reconnecting...', {
              icon: '🔌',
              duration: 4000,
            });
          }
          
          // Attempt reconnect after delay (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, 3), 30000); // Max 30 seconds
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          isConnecting = false;
          setWsConnected(false);
        };

      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
        isConnecting = false;
        setWsConnected(false);
        
        // Retry connection after delay
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [_handleWebSocketUpdate, setWsConnected]); // Removed _updateTaskInBackend from dependencies
}