import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (socket) return socket;

  // Trigger socket server initialization
  fetch('/api/socket').catch(() => {});

  socket = io({
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['polling', 'websocket'],
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
