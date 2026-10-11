import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export interface ChatMessageData {
  id?: string;
  threadId: string;
  sender: 'user' | 'peer' | 'system';
  senderName?: string;
  text: string;
  at?: string;
}

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join thread room (e.g., driver-contractor messaging channel)
    socket.on('join_thread', ({ threadId }: { threadId: string }) => {
      const room = `thread:${threadId}`;
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} joined room ${room}`);
    });

    // Leave thread room
    socket.on('leave_thread', ({ threadId }: { threadId: string }) => {
      const room = `thread:${threadId}`;
      socket.leave(room);
      console.log(`[Socket.io] Socket ${socket.id} left room ${room}`);
    });

    // Real-time message broadcast between Driver and Contractor
    socket.on('send_message', (payload: ChatMessageData) => {
      const room = `thread:${payload.threadId}`;
      const msg: ChatMessageData = {
        id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        threadId: payload.threadId,
        sender: payload.sender || 'peer',
        senderName: payload.senderName,
        text: payload.text,
        at: payload.at || new Date().toISOString(),
      };

      console.log(`[Socket.io] Broadcasting message in ${room}: "${msg.text}"`);
      // Broadcast to everyone in the thread room
      io?.to(room).emit('receive_message', msg);
    });

    // Typing status broadcast
    socket.on('typing_status', ({ threadId, isTyping, user }: { threadId: string; isTyping: boolean; user?: string }) => {
      const room = `thread:${threadId}`;
      socket.to(room).emit('typing_status', { threadId, isTyping, user });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}
