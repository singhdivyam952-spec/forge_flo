import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { INotification } from '../models/Notification';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketIOServer | undefined;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function roleRoom(role: string): string {
  return `role:${role}`;
}

/**
 * Initializes Socket.IO on top of the given HTTP server, authenticating
 * every connection via the same JWT access tokens used by the REST API,
 * and joining sockets to per-user and per-role rooms for targeted
 * notification delivery.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.toString().replace('Bearer ', ''));

      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket.userId) {
      socket.join(userRoom(socket.userId));
    }
    if (socket.userRole) {
      socket.join(roleRoom(socket.userRole));
    }

    logger.info('Socket connected', { socketId: socket.id, userId: socket.userId });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId: socket.userId, reason });
    });

    socket.on('notification:read', (notificationId: string) => {
      socket.emit('notification:read:ack', { notificationId });
    });
  });

  logger.info('Socket.IO server initialized');

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized yet. Call initSocketServer() first.');
  }
  return io;
}

/** Emits a notification event to a specific user's active socket connections. */
export function emitNotificationToUser(userId: string, notification: Partial<INotification>): void {
  if (!io) return;
  io.to(userRoom(userId)).emit('notification:new', notification);
}

/** Emits a notification event to every socket connection belonging to users with the given role. */
export function emitNotificationToRole(role: string, notification: Partial<INotification>): void {
  if (!io) return;
  io.to(roleRoom(role)).emit('notification:new', notification);
}

/** Broadcasts a generic real-time event to all connected clients. */
export function broadcastEvent(event: string, payload: unknown): void {
  if (!io) return;
  io.emit(event, payload);
}

export default { initSocketServer, getSocketServer, emitNotificationToUser, emitNotificationToRole, broadcastEvent };
