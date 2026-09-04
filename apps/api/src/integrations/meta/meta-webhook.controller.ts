import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { Prisma } from '@lead-saas/database';
import { Public } from '../../common/public.decorator.js';
import { DatabaseService } from '../../common/database.module.js';
import { MetaQueueService } from './meta-queue.service.js';
import { MetaWebhookVerifier } from './meta-webhook-verifier.js';

type LeadChange = { field?: string; value?: { page_id?: string; form_id?: string; leadgen_id?: string; created_time?: number } };
type MessagingEvent={sender?:{id?:string};recipient?:{id?:string};timestamp?:number;message?:{mid?:string;text?:string;is_echo?:boolean}};
type MetaPayload = { object?: string; entry?: Array<{ id?: string; changes?: LeadChange[];messaging?:MessagingEvent[] }> };
@Public()
@Controller('webhooks/meta')
export class MetaWebhookController {
  constructor(private readonly verifier: MetaWebhookVerifier, private readonly config: ConfigService, private readonly db: DatabaseService, private readonly queue: MetaQueueService) {}
  @Get() challenge(@Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) { return this.verifier.verifyChallenge(mode, token, challenge, this.config.getOrThrow('META_WEBHOOK_VERIFY_TOKEN')); }
  @Post() async receive(@Req() request: RawBodyRequest<Request>, @Headers('x-hub-signature-256') signature: string | undefined, @Body() payload: MetaPayload) {
    this.verifier.verifySignature(request.rawBody, signature, this.config.getOrThrow('META_APP_SECRET'));
    if (payload.object !== 'page') return { received: true };
    for (const entry of payload.entry ?? []) for (const change of entry.changes ?? []) {
      const value = change.value;
      if (change.field !== 'leadgen' || !value?.leadgen_id || !value.page_id) continue;
      const page = await this.db.metaPage.findFirst({ where: { externalPageId: value.page_id, status: 'ACTIVE', integration: { status: 'CONNECTED' } }, select: { organizationId: true } });
      if (!page) continue;
      const event = await this.db.webhookEvent.upsert({ where: { provider_providerEventId: { provider: 'META', providerEventId: `${value.page_id}:${value.leadgen_id}` } }, create: { organizationId: page.organizationId, provider: 'META', providerEventId: `${value.page_id}:${value.leadgen_id}`, payload: payload as Prisma.InputJsonValue }, update: {}, select: { id: true } });
      await this.queue.enqueue(event.id);
    }
    for(const entry of payload.entry??[])for(const messaging of entry.messaging??[]){const pageId=entry.id;const mid=messaging.message?.mid;if(!pageId||!mid||messaging.message?.is_echo)continue;const page=await this.db.metaPage.findFirst({where:{externalPageId:pageId,status:'ACTIVE',integration:{status:'CONNECTED'}},select:{organizationId:true}});if(!page)continue;const event=await this.db.webhookEvent.upsert({where:{provider_providerEventId:{provider:'META',providerEventId:`message:${mid}`}},create:{organizationId:page.organizationId,provider:'META',providerEventId:`message:${mid}`,payload:{pageId,messaging} as Prisma.InputJsonValue},update:{},select:{id:true}});await this.queue.enqueueIncomingMessage(event.id);}
    return { received: true };
  }
}
