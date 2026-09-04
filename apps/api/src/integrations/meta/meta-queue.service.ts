import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
@Injectable()
export class MetaQueueService implements OnModuleDestroy {
  private readonly connection: Redis;
  private readonly queue: Queue;
  private readonly incomingQueue: Queue;
  constructor(config: ConfigService) {
    this.connection = new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: null });
    this.queue = new Queue('meta-lead-fetch', { connection: this.connection, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: 1_000, removeOnFail: 5_000 } });
    this.incomingQueue = new Queue('meta-webhooks', { connection: this.connection, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: 1_000, removeOnFail: 5_000 } });
  }
  enqueue(eventId: string) { return this.queue.add('fetch-lead', { eventId }, { jobId: eventId }); }
  enqueueIncomingMessage(eventId:string){return this.incomingQueue.add('incoming-message',{eventId},{jobId:eventId});}
  async onModuleDestroy(): Promise<void> { await this.queue.close();await this.incomingQueue.close(); await this.connection.quit(); }
}
