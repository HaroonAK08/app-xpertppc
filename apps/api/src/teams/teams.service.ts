import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@lead-saas/database';
import { DatabaseService } from '../common/database.module.js';
import type { AuthContext } from '../common/auth-context.js';
import { PlanLimitsService } from '../billing/plan-limits.service.js';
import { EmailQueueService } from '../common/email-queue.module.js';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class TeamsService {
  constructor(private readonly db: DatabaseService,private readonly limits:PlanLimitsService,private readonly email:EmailQueueService) {}
  list(organizationId: string) { return this.db.organizationUser.findMany({ where: { organizationId }, select: { role: true, status: true, joinedAt: true, user: { select: { id: true, email: true, name: true, phone: true } } }, orderBy: { joinedAt: 'asc' } }); }
  async invite(auth: AuthContext, email: string, role: Role) {
    if (role === 'OWNER') throw new BadRequestException('Ownership cannot be granted through an invitation.');
    const normalized = email.toLowerCase();
    const existingUser = await this.db.user.findUnique({ where: { email: normalized } });
    const existingMembership=existingUser?await this.db.organizationUser.findUnique({where:{organizationId_userId:{organizationId:auth.organizationId,userId:existingUser.id}}}):null;if(!existingMembership)await this.limits.assertUsers(auth.organizationId);
    const rawToken = randomBytes(32).toString('base64url');
    const invitation = await this.db.organizationInvitation.upsert({ where: { organizationId_email: { organizationId: auth.organizationId, email: normalized } }, create: { organizationId: auth.organizationId, email: normalized, role, tokenHash: hash(rawToken), expiresAt: new Date(Date.now() + 7 * 86_400_000) }, update: { role, tokenHash: hash(rawToken), expiresAt: new Date(Date.now() + 7 * 86_400_000), acceptedAt: null } });
    await this.audit(auth, 'MEMBER_INVITED', invitation.id);
    await this.email.enqueue(normalized,'ORGANIZATION_INVITATION',{acceptUrl:`${process.env.MOBILE_PUBLIC_URL}invitation/${encodeURIComponent(rawToken)}`});
    return { status: 'INVITED', invitationId: invitation.id };
  }
  async update(auth: AuthContext, userId: string, role: Role) {
    const current = await this.member(auth.organizationId, userId);
    if (current.role === 'OWNER') throw new BadRequestException('The owner role cannot be changed here.');
    if (role === 'OWNER') throw new BadRequestException('Use an ownership-transfer workflow.');
    const updated = await this.db.organizationUser.update({ where: { organizationId_userId: { organizationId: auth.organizationId, userId } }, data: { role } });
    await this.audit(auth, 'MEMBER_ROLE_UPDATED', updated.id);
    return updated;
  }
  async remove(auth: AuthContext, userId: string) {
    const current = await this.member(auth.organizationId, userId);
    if (current.role === 'OWNER') throw new BadRequestException('The organization owner cannot be removed.');
    await this.db.$transaction([
      this.db.organizationUser.delete({ where: { organizationId_userId: { organizationId: auth.organizationId, userId } } }),
      this.db.authSession.updateMany({ where: { organizationId: auth.organizationId, userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.db.auditLog.create({ data: { organizationId: auth.organizationId, actorUserId: auth.userId, action: 'MEMBER_REMOVED', entityType: 'User', entityId: userId } }),
    ]);
    return { success: true };
  }
  async accept(auth:AuthContext,token:string){const invitation=await this.db.organizationInvitation.findUnique({where:{tokenHash:hash(token)}});const user=await this.db.user.findUnique({where:{id:auth.userId}});if(!invitation||!user||invitation.email!==user.email||invitation.acceptedAt||invitation.expiresAt<=new Date())throw new BadRequestException('Invitation is invalid or expired.');await this.db.$transaction([this.db.organizationUser.upsert({where:{organizationId_userId:{organizationId:invitation.organizationId,userId:user.id}},create:{organizationId:invitation.organizationId,userId:user.id,role:invitation.role},update:{role:invitation.role,status:'ACTIVE'}}),this.db.organizationInvitation.update({where:{id:invitation.id},data:{acceptedAt:new Date()}}),this.db.auditLog.create({data:{organizationId:invitation.organizationId,actorUserId:user.id,action:'INVITATION_ACCEPTED',entityType:'OrganizationInvitation',entityId:invitation.id}})]);return{accepted:true,organizationId:invitation.organizationId}}
  private async member(organizationId: string, userId: string) { const value = await this.db.organizationUser.findUnique({ where: { organizationId_userId: { organizationId, userId } } }); if (!value) throw new NotFoundException('Team member was not found.'); return value; }
  private audit(auth: AuthContext, action: string, entityId: string) { return this.db.auditLog.create({ data: { organizationId: auth.organizationId, actorUserId: auth.userId, action, entityType: 'OrganizationUser', entityId } }); }
}
