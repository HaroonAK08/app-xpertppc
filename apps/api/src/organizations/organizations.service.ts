import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../common/database.module.js';
import type { AuthContext } from '../common/auth-context.js';
import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.dto.js';
@Injectable()
export class OrganizationsService {
  constructor(private readonly db: DatabaseService) {}
  current(auth: AuthContext) { return this.db.organization.findFirst({ where: { id: auth.organizationId, memberships: { some: { userId: auth.userId, status: 'ACTIVE' } } }, select: { id: true, name: true, slug: true, timezone: true, status: true } }); }
  list(userId:string){return this.db.organizationUser.findMany({where:{userId,status:'ACTIVE'},select:{role:true,organization:{select:{id:true,name:true,slug:true,status:true}}}})}
  async create(auth: AuthContext, input: CreateOrganizationDto) {
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${randomUUID().slice(0, 8)}`;
    return this.db.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: input.name, slug,plan:{connect:{key:'STARTER'}} } });
      await tx.organizationUser.create({ data: { organizationId: organization.id, userId: auth.userId, role: 'OWNER' } });
      await tx.leadStatus.createMany({ data: ['NEW','CONTACTED','QUALIFIED','PROPOSAL','WON','LOST'].map((key, position) => ({ organizationId: organization.id, key, name: key[0] + key.slice(1).toLowerCase(), position, isTerminal: key === 'WON' || key === 'LOST' })) });
      return organization;
    });
  }
  async update(auth: AuthContext, input: UpdateOrganizationDto) {
    const result = await this.db.organization.updateMany({ where: { id: auth.organizationId }, data: input });
    if (!result.count) throw new NotFoundException('Organization was not found.');
    await this.db.auditLog.create({ data: { organizationId: auth.organizationId, actorUserId: auth.userId, action: 'ORGANIZATION_UPDATED', entityType: 'Organization', entityId: auth.organizationId } });
    return this.current(auth);
  }
}
