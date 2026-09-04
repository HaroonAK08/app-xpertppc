import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, type LeadSource } from '@lead-saas/database';
import { DatabaseService } from '../common/database.module.js';
import type { AuthContext } from '../common/auth-context.js';
import type { AddTagsDto, UpdateLeadDto } from './leads.dto.js';
@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}
  async list(auth:AuthContext, limit = 25, cursor?: string, search?: string, statusId?: string, assignedUserId?: string, source?: LeadSource, formId?: string, campaignId?: string,tagId?:string,dateFrom?:string,dateTo?:string,sort:'newest'|'oldest'='newest') {
    const take = Math.min(Math.max(limit, 1), 100);
    const where: Prisma.LeadWhereInput = { organizationId:auth.organizationId,...(auth.role==='AGENT'?{assignedUserId:auth.userId}:assignedUserId?{assignedUserId}:{}), ...(statusId && { statusId }), ...(source && { source }), ...(formId && { externalFormId: formId }), ...(campaignId && { campaignExternalId: campaignId }),...(tagId?{tags:{some:{tagId}}}:{}),...((dateFrom||dateTo)?{createdAt:{...(dateFrom?{gte:new Date(dateFrom)}:{}),...(dateTo?{lte:new Date(dateTo)}:{})}}:{}), ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }) };
    const direction=sort==='oldest'?'asc':'desc';const rows = await this.db.lead.findMany({ where, take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: [{ createdAt: direction }, { id: direction }], include: { status: true, assignedUser: { select: { id: true, name: true } }, tags: { include: { tag: true } } } });
    const hasMore = rows.length > take;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? rows.at(-1)?.id ?? null : null };
  }
  async get(organizationId: string, id: string,agentUserId?:string) { const lead = await this.db.lead.findFirst({ where: { id, organizationId,...(agentUserId?{assignedUserId:agentUserId}:{}) }, include: { status: true, assignedUser: { select: { id: true, name: true } }, notes: { orderBy: { createdAt: 'desc' } }, activities: { orderBy: { createdAt: 'desc' } }, tags: { include: { tag: true } } } }); if (!lead) throw new NotFoundException('Lead was not found.'); return lead; }
  async update(auth: AuthContext, id: string, data: UpdateLeadDto) {
    const lead = await this.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined);
    if (data.statusId) await this.requireStatus(auth.organizationId, data.statusId);
    const updated = await this.db.lead.update({ where: { id: lead.id }, data });
    if (data.statusId && data.statusId !== lead.statusId) await this.activity(auth, id, ActivityType.STATUS_CHANGED, { from: lead.statusId, to: data.statusId });
    await this.audit(auth, 'LEAD_UPDATED', id);
    return updated;
  }
  async assign(auth: AuthContext, id: string, userId: string) {
    const lead = await this.get(auth.organizationId, id);
    const member = await this.db.organizationUser.findUnique({ where: { organizationId_userId: { organizationId: auth.organizationId, userId } } });
    if (!member || member.status !== 'ACTIVE' || member.role === 'VIEWER') throw new BadRequestException('Assignee must be an active non-viewer organization member.');
    const updated = await this.db.lead.update({ where: { id: lead.id }, data: { assignedUserId: userId } });
    await this.activity(auth, id, ActivityType.LEAD_ASSIGNED, { from: lead.assignedUserId, to: userId }); await this.audit(auth, 'LEAD_ASSIGNED', id); return updated;
  }
  async note(auth: AuthContext, id: string, body: string) { await this.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined); const note = await this.db.leadNote.create({ data: { organizationId: auth.organizationId, leadId: id, authorUserId: auth.userId, body } }); await this.activity(auth, id, ActivityType.NOTE_ADDED, { noteId: note.id }); return note; }
  async activityList(auth:AuthContext, leadId: string) { await this.get(auth.organizationId,leadId,auth.role==='AGENT'?auth.userId:undefined);return this.db.activity.findMany({ where: { organizationId:auth.organizationId, leadId }, orderBy: { createdAt: 'desc' } }); }
  async addTags(auth: AuthContext, id: string, input: AddTagsDto) { await this.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined); const count = await this.db.tag.count({ where: { organizationId: auth.organizationId, id: { in: input.tagIds } } }); if (count !== new Set(input.tagIds).size) throw new BadRequestException('One or more tags are invalid.'); await this.db.leadTag.createMany({ data: input.tagIds.map((tagId) => ({ leadId: id, tagId })), skipDuplicates: true }); await this.activity(auth, id, ActivityType.TAG_ADDED, { tagIds: input.tagIds }); return this.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined); }
  async removeTag(auth: AuthContext, id: string, tagId: string) { await this.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined); const tag = await this.db.tag.findFirst({ where: { id: tagId, organizationId: auth.organizationId } }); if (!tag) throw new NotFoundException('Tag was not found.'); await this.db.leadTag.deleteMany({ where: { leadId: id, tagId } }); return { success: true }; }
  private async requireStatus(organizationId: string, id: string) { if (!await this.db.leadStatus.findFirst({ where: { id, organizationId } })) throw new BadRequestException('Lead status is invalid.'); }
  private activity(auth: AuthContext, leadId: string, type: ActivityType, metadataJson: Prisma.InputJsonValue) { return this.db.activity.create({ data: { organizationId: auth.organizationId, leadId, actorUserId: auth.userId, type, metadataJson } }); }
  private audit(auth: AuthContext, action: string, entityId: string) { return this.db.auditLog.create({ data: { organizationId: auth.organizationId, actorUserId: auth.userId, action, entityType: 'Lead', entityId } }); }
}
