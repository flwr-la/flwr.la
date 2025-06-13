import Bull from 'bull';
import { logger } from '../utils/logger';
import { BloomEngine } from '../core/bloom-engine';
import { MemoryConsolidator } from '../services/memory-consolidator';
import { FlowerArchiver } from '../services/flower-archiver';
import { MetricsCollector } from '../services/metrics-collector';

export class QueueProcessor {
  private queues: Map<string, Bull.Queue>;
  private bloomEngine: BloomEngine;

  constructor(bloomEngine: BloomEngine) {
    this.bloomEngine = bloomEngine;
    this.queues = new Map();

    this.initializeQueues();
    this.setupProcessors();
  }

  private initializeQueues() {
    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    };

    // Create queues
    this.queues.set('memory-consolidation', new Bull('memory-consolidation', redisConfig));
    this.queues.set('flower-evolution', new Bull('flower-evolution', redisConfig));
    this.queues.set('metrics-aggregation', new Bull('metrics-aggregation', redisConfig));
    this.queues.set('flower-archival', new Bull('flower-archival', redisConfig));
    this.queues.set('llm-requests', new Bull('llm-requests', redisConfig));
  }

  private setupProcessors() {
    // Memory consolidation processor
    this.queues.get('memory-consolidation')!.process(async (job) => {
      const { flowerId } = job.data;
      logger.info('Processing memory consolidation', { flowerId });

      try {
        const consolidator = new MemoryConsolidator();
        const flower = await this.bloomEngine.getFlower(flowerId);

        const consolidatedMemory = await consolidator.consolidate(flower.memory);
        await this.bloomEngine.updateFlowerMemory(flowerId, consolidatedMemory);

        logger.info('Memory consolidation completed', { flowerId });
        return { success: true, memorySize: consolidatedMemory.longTerm.length };
      } catch (error) {
        logger.error('Memory consolidation failed', { error, flowerId });
        throw error;
      }
    });

    // Flower evolution processor
    this.queues.get('flower-evolution')!.process(async (job) => {
      const { flowerId, trigger } = job.data;
      logger.info('Processing flower evolution', { flowerId, trigger });

      try {
        const flower = await this.bloomEngine.getFlower(flowerId);
        const evolved = await this.bloomEngine.evolveFlower(flower, trigger);

        return { 
          success: true, 
          changes: evolved.metadata.evolutionHistory?.slice(-1)[0] 
        };
      } catch (error) {
        logger.error('Flower evolution failed', { error, flowerId });
        throw error;
      }
    });

    // Metrics aggregation processor
    this.queues.get('metrics-aggregation')!.process(async (job) => {
      const { userId, period } = job.data;
      logger.info('Processing metrics aggregation', { userId, period });

      try {
        const collector = new MetricsCollector();
        const metrics = await collector.aggregate(userId, period);

        // Store aggregated metrics
        await collector.store(userId, period, metrics);

        return { success: true, metrics };
      } catch (error) {
        logger.error('Metrics aggregation failed', { error, userId });
        throw error;
      }
    });

    // Flower archival processor
    this.queues.get('flower-archival')!.process(async (job) => {
      const { flowerId, reason } = job.data;
      logger.info('Processing flower archival', { flowerId, reason });

      try {
        const archiver = new FlowerArchiver();
        const archived = await archiver.archive(flowerId, reason);

        return { success: true, archivedAt: archived.timestamp };
      } catch (error) {
        logger.error('Flower archival failed', { error, flowerId });
        throw error;
      }
    });

    // LLM request processor with rate limiting
    this.queues.get('llm-requests')!.process(5, async (job) => {
      const { request, priority } = job.data;
      logger.info('Processing LLM request', { requestId: request.id, priority });

      try {
        // Process with appropriate rate limiting
        const response = await this.bloomEngine.processLLMRequest(request);

        return { success: true, response };
      } catch (error) {
        logger.error('LLM request failed', { error, requestId: request.id });
        throw error;
      }
    });
  }

  public async scheduleMemoryConsolidation(flowerId: string) {
    await this.queues.get('memory-consolidation')!.add(
      { flowerId },
      {
        delay: 60000, // 1 minute delay
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );
  }

  public async scheduleFlowerEvolution(flowerId: string, trigger: string) {
    await this.queues.get('flower-evolution')!.add(
      { flowerId, trigger },
      {
        priority: 1,
        attempts: 2
      }
    );
  }

  public async scheduleMetricsAggregation(userId: string, period: string) {
    await this.queues.get('metrics-aggregation')!.add(
      { userId, period },
      {
        repeat: {
          cron: '0 0 * * *' // Daily at midnight
        }
      }
    );
  }

  public async getQueueStats() {
    const stats: Record<string, any> = {};

    for (const [name, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      stats[name] = counts;
    }

    return stats;
  }
}
