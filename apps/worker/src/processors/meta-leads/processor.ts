import type { Job, Queue } from 'bullmq';
import type { PrismaClient, Prisma } from '@lead-saas/database';
import type { Redis } from 'ioredis';
import { decryptCredential } from '../../common/credential-cipher.js';
import { normalizeMetaLead, type MetaLeadPayload } from './normalize.js';
import { matchingActions } from './automation.js';

type LeadJob = { eventId: string };
export class MetaLeadProcessor {
  constructor(private readonly db: PrismaClient, private readonly redis: Redis, private readonly pushQueue: Queue, private readonly graphVersion: string, private readonly encryptionKey: string) {}
  async process(job: Job<LeadJob>): Promise<{leadId:string;created:boolean}> {
    const event = await this.db.webhookEvent.findUnique({ where: { id: job.data.eventId } });
    if (!event) throw new Error('Webhook event not found');
    if (event.status === 'PROCESSED') { const externalId = event.providerEventId.split(':').at(-1)!; const lead = await this.db.lead.findUniqueOrThrow({ where: { organizationId_source_sourceExternalId: { organizationId: event.organizationId!, source: 'META_LEAD_AD', sourceExternalId: externalId } } }); return {leadId:lead.id,created:false}; }
    if (!event.organizationId) throw new Error('Webhook event has no organization');
    await this.db.webhookEvent.update({ where: { id: event.id }, data: { status: 'PROCESSING' } });
    try {
      const [pageId, leadgenId] = event.providerEventId.split(':');
      if (!pageId || !leadgenId) throw new Error('Webhook event identifier is invalid');
      const page = await this.db.metaPage.findFirst({ where: { organizationId: event.organizationId, externalPageId: pageId, status: 'ACTIVE' } });
      if (!page?.accessTokenReference) throw new Error('Connected Page credential is unavailable');
      const token = decryptCredential(page.accessTokenReference, this.encryptionKey);
      const response = await fetch(`https://graph.facebook.com/${this.graphVersion}/${encodeURIComponent(leadgenId)}?fields=id,created_time,ad_id,form_id,field_data`, { headers: { authorization: `Bearer ${token}` } });
      const provider = await response.json() as MetaLeadPayload & {error?:unknown};
      if (!response.ok || provider.error) throw new Error('Meta lead retrieval failed');
      const normalized = normalizeMetaLead(provider);
      const existing = await this.db.lead.findUnique({ where: { organizationId_source_sourceExternalId: { organizationId: event.organizationId, source: 'META_LEAD_AD', sourceExternalId: normalized.externalId } } });
      if (existing) { await this.db.webhookEvent.update({ where:{id:event.id}, data:{status:'PROCESSED',processedAt:new Date()} }); return {leadId:existing.id,created:false}; }
      const rules=await this.db.automationRule.findMany({where:{organizationId:event.organizationId,enabled:true,trigger:'LEAD_CREATED'},orderBy:{position:'asc'},select:{conditions:true,actions:true}});const actions=matchingActions(rules,{source:'META_LEAD_AD',...(normalized.formId?{formId:normalized.formId}:{})});const requestedUser=actions.find(a=>a.type==='ASSIGN_USER')?.userId;const requestedTeam=actions.find(a=>a.type==='ASSIGN_TEAM')?.teamId;let assignedUserId:string|undefined;if(requestedUser){const member=await this.db.organizationUser.findFirst({where:{organizationId:event.organizationId,userId:requestedUser,status:'ACTIVE',role:{not:'VIEWER'}}});assignedUserId=member?.userId}else if(requestedTeam){const member=await this.db.teamMember.findFirst({where:{teamId:requestedTeam,team:{organizationId:event.organizationId},user:{memberships:{some:{organizationId:event.organizationId,status:'ACTIVE',role:{not:'VIEWER'}}}}},select:{userId:true}});assignedUserId=member?.userId}const requestedTagIds=actions.filter(a=>a.type==='ADD_TAG'&&a.tagId).map(a=>a.tagId!);const validTags=await this.db.tag.findMany({where:{organizationId:event.organizationId,id:{in:requestedTagIds}},select:{id:true}});const explicitNotify=actions.filter(a=>a.type==='NOTIFY_USER'&&a.userId).map(a=>a.userId!);const recipients = await this.db.organizationUser.findMany({ where: { organizationId:event.organizationId,status:'ACTIVE',OR:[{role:{in:['OWNER','ADMIN','MANAGER']}},{userId:{in:explicitNotify}}] }, select:{userId:true} });
      const result = await this.db.$transaction(async (tx) => {
        const status = await tx.leadStatus.findUniqueOrThrow({ where:{organizationId_key:{organizationId:event.organizationId!,key:'NEW'}} });
        const lead = await tx.lead.create({ data:{organizationId:event.organizationId!,source:'META_LEAD_AD',sourceExternalId:normalized.externalId,externalPageId:pageId,externalFormId:normalized.formId ?? null,name:normalized.name ?? null,email:normalized.email ?? null,phone:normalized.phone ?? null,adExternalId:normalized.adId ?? null,rawDataJson:normalized.raw as Prisma.InputJsonValue,statusId:status.id,assignedUserId:assignedUserId??null} });
        await tx.activity.create({data:{organizationId:event.organizationId!,leadId:lead.id,type:'LEAD_CREATED',metadataJson:{source:'META_LEAD_AD'}}});
        if(assignedUserId)await tx.activity.create({data:{organizationId:event.organizationId!,leadId:lead.id,type:'LEAD_ASSIGNED',metadataJson:{to:assignedUserId,automation:true}}});
        if(validTags.length)await tx.leadTag.createMany({data:validTags.map(tag=>({leadId:lead.id,tagId:tag.id}))});
        const notifications = await Promise.all(recipients.map(({userId})=>tx.notification.create({data:{organizationId:event.organizationId!,userId,type:'NEW_LEAD',title:'New lead',body:normalized.name ? `${normalized.name} submitted a lead form.` : 'A new lead submitted a form.',dataJson:{leadId:lead.id,deepLink:`app://lead/${lead.id}`}}})));
        await tx.webhookEvent.update({where:{id:event.id},data:{status:'PROCESSED',processedAt:new Date()}});
        const periodStart=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1));const periodEnd=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1));await tx.usageCounter.upsert({where:{organizationId_metric_periodStart:{organizationId:event.organizationId!,metric:'leads',periodStart}},create:{organizationId:event.organizationId!,metric:'leads',periodStart,periodEnd,value:1},update:{value:{increment:1}}});
        return {lead,notifications};
      });
      for (const notification of result.notifications) await this.pushQueue.add('send-push',{notificationId:notification.id},{jobId:notification.id});
      await this.redis.publish(`realtime:organization:${event.organizationId}`,JSON.stringify({event:'lead.created',data:{leadId:result.lead.id}}));
      return {leadId:result.lead.id,created:true};
    } catch (error) { await this.db.webhookEvent.update({where:{id:event.id},data:{status:'ERROR'}}); throw error; }
  }
}
