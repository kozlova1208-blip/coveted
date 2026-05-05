import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

let sharedSocket = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = sharedSocket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sharedSocket.on('connect', onConnect);
    sharedSocket.on('disconnect', onDisconnect);

    if (sharedSocket.connected) setConnected(true);

    return () => {
      sharedSocket.off('connect', onConnect);
      sharedSocket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current || sharedSocket, connected };
}
