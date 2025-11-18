'use client';

import { WebSocketProvider } from '../context/WebSocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  // We wrap the app in the WebSocket provider
  return <WebSocketProvider>{children}</WebSocketProvider>;
}