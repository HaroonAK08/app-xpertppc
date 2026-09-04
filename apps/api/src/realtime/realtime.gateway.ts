import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { DatabaseService } from '../common/database.module.js';
import type { AuthContext } from '../common/auth-context.js';
@Injectable()
@WebSocketGateway({ namespace: '/realtime', cors: { origin: false } })
export class RealtimeGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Server;
  private readonly subscriber: Redis;
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService, private readonly db: DatabaseService) { this.subscriber = new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: null }); }
  async onModuleInit(): Promise<void> { await this.subscriber.psubscribe('realtime:organization:*'); this.subscriber.on('pmessage',(_pattern,channel,message)=>{ const organizationId=channel.slice('realtime:organization:'.length); try { const payload=JSON.parse(message) as {event:string;data:unknown}; if(payload.event) this.server.to(`organization:${organizationId}`).emit(payload.event,payload.data); } catch { /* malformed internal events are ignored and logged by producer */ } }); }
  async handleConnection(socket: Socket): Promise<void> { try { const token=socket.handshake.auth?.token; if(typeof token!=='string')throw new Error('missing token'); const auth=await this.jwt.verifyAsync<AuthContext>(token,{secret:this.config.getOrThrow('AUTH_SECRET')}); const membership=await this.db.organizationUser.findUnique({where:{organizationId_userId:{organizationId:auth.organizationId,userId:auth.userId}}}); if(!membership||membership.status!=='ACTIVE')throw new Error('inactive membership'); socket.data.auth=auth; await socket.join(`organization:${auth.organizationId}`); socket.emit('session.ready',{organizationId:auth.organizationId}); } catch { socket.disconnect(true); } }
  async onModuleDestroy():Promise<void>{await this.subscriber.quit();}
}
