// app/providers.tsx
'use client';

import { WebSocketProvider } from '../context/WebSocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}