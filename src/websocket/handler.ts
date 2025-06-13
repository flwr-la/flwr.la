import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { BloomEngine } from '../core/bloom-engine';
import { redisClient } from '../utils/redis';

export class WebSocketHandler {
  private io: SocketServer;
  private bloomEngine: BloomEngine;
  private activeSessions: Map<string, Set<string>>;

  constructor(server: Server, bloomEngine: BloomEngine) {
    this.bloomEngine = bloomEngine;
    this.activeSessions = new Map();

    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;

        logger.info('WebSocket authenticated', { userId: decoded.id });
        next();
      } catch (error) {
        logger.error('WebSocket auth failed', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      logger.info('WebSocket connected', { userId, socketId: socket.id });

      // Join user room
      socket.join(`user:${userId}`);

      // Handle flower subscription
      socket.on('subscribe:flower', async (flowerId: string) => {
        try {
          // Verify user owns the flower
          const flower = await this.bloomEngine.getFlower(flowerId);
          if (flower.userId !== userId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          socket.join(`flower:${flowerId}`);

          // Track active session
          if (!this.activeSessions.has(flowerId)) {
            this.activeSessions.set(flowerId, new Set());
          }
          this.activeSessions.get(flowerId)!.add(socket.id);

          socket.emit('subscribed:flower', { flowerId });

          // Send current state
          socket.emit('flower:state', {
            flowerId,
            state: flower.state,
            metadata: flower.metadata
          });
        } catch (error) {
          logger.error('Subscribe flower failed', { error, flowerId });
          socket.emit('error', { message: 'Subscription failed' });
        }
      });

      // Handle real-time interaction
      socket.on('flower:tend', async (data: {
        sessionId: string;
        message: string;
      }) => {
        try {
          const startTime = Date.now();

          // Emit typing indicator
          socket.to(`flower:${data.sessionId}`).emit('flower:typing', {
            sessionId: data.sessionId
          });

          // Process interaction
          const result = await this.bloomEngine.tend(
            data.sessionId,
            data.message
          );

          const responseTime = Date.now() - startTime;

          // Emit response
          this.io.to(`flower:${data.sessionId}`).emit('flower:response', {
            sessionId: data.sessionId,
            response: result.response,
            state: result.state,
            metadata: {
              responseTime,
              tokensUsed: result.tokensUsed
            }
          });

          // Update metrics
          await this.updateMetrics(userId, {
            responseTime,
            tokensUsed: result.tokensUsed
          });
        } catch (error) {
          logger.error('Flower tend failed', { error, sessionId: data.sessionId });
          socket.emit('error', { message: 'Interaction failed' });
        }
      });

      // Handle state sync
      socket.on('flower:sync', async (flowerId: string) => {
        try {
          const flower = await this.bloomEngine.getFlower(flowerId);

          socket.emit('flower:state', {
            flowerId,
            state: flower.state,
            metadata: flower.metadata,
            memory: {
              shortTermCount: flower.memory.shortTerm.length,
              longTermCount: flower.memory.longTerm.length,
              episodicCount: flower.memory.episodic.length
            }
          });
        } catch (error) {
          logger.error('Flower sync failed', { error, flowerId });
          socket.emit('error', { message: 'Sync failed' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket disconnected', { userId, socketId: socket.id });

        // Clean up active sessions
        for (const [flowerId, sockets] of this.activeSessions) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.activeSessions.delete(flowerId);
          }
        }
      });
    });
  }

  public emitFlowerEvent(flowerId: string, event: string, data: any) {
    this.io.to(`flower:${flowerId}`).emit(event, data);
  }

  public emitUserEvent(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  private async updateMetrics(userId: string, metrics: any) {
    const key = `metrics:${userId}:${new Date().toISOString().split('T')[0]}`;

    await redisClient.hincrby(key, 'interactions', 1);
    await redisClient.hincrby(key, 'totalResponseTime', metrics.responseTime);
    await redisClient.hincrby(key, 'totalTokens', metrics.tokensUsed);
    await redisClient.expire(key, 86400 * 30); // 30 days
  }
}
