import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NetSocket & {
    server: SocketServer;
  };
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new SocketIOServer(res.socket.server as unknown as HTTPServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-poll', (pollId: string) => {
      socket.join(pollId);
    });

    socket.on('leave-poll', (pollId: string) => {
      socket.leave(pollId);
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  res.socket.server.io = io;
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
