import { Global,Injectable,Module,OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
export type EmailTemplate='PASSWORD_RESET'|'ORGANIZATION_INVITATION';
@Injectable()export class EmailQueueService implements OnModuleDestroy{private readonly connection:Redis;private readonly queue:Queue;constructor(config:ConfigService){this.connection=new Redis(config.getOrThrow('REDIS_URL'),{maxRetriesPerRequest:null});this.queue=new Queue('transactional-email',{connection:this.connection,defaultJobOptions:{attempts:8,backoff:{type:'exponential',delay:3000},removeOnComplete:1000,removeOnFail:5000}})}enqueue(to:string,template:EmailTemplate,variables:Record<string,string>){return this.queue.add('deliver-email',{to,template,variables})}async onModuleDestroy(){await this.queue.close();await this.connection.quit()}}
@Global()@Module({providers:[EmailQueueService],exports:[EmailQueueService]})export class EmailQueueModule{}
