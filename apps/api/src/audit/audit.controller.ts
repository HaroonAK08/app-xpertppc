import { Controller, Get, Query } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { DatabaseService } from '../common/database.module.js';
import { Roles } from '../common/roles.decorator.js';
@Controller('v1/audit-logs')
export class AuditController {
  constructor(private readonly db: DatabaseService) {}
  @Roles('OWNER','ADMIN') @Get() list(@CurrentAuth() auth: AuthContext, @Query('cursor') cursor?: string) { return this.db.auditLog.findMany({ where: { organizationId: auth.organizationId }, take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }); }
}
