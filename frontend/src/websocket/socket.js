import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token || socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || '', {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const joinFactory = (factoryId) => socket?.emit('join:factory', factoryId);
export const joinLine = (lineId) => socket?.emit('join:line', lineId);
