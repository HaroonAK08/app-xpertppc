import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { DatabaseService } from '../common/database.module.js';
import { Roles } from '../common/roles.decorator.js';
import { CreateStatusDto, CreateTagDto, UpdateStatusDto } from './crm-settings.dto.js';
@Controller('v1')
export class CrmSettingsController {
  constructor(private readonly db: DatabaseService) {}
  @Get('lead-statuses') statuses(@CurrentAuth() auth: AuthContext) { return this.db.leadStatus.findMany({ where: { organizationId: auth.organizationId }, orderBy: { position: 'asc' } }); }
  @Roles('OWNER','ADMIN') @Post('lead-statuses') createStatus(@CurrentAuth() auth: AuthContext, @Body() body: CreateStatusDto) { return this.db.leadStatus.create({ data: { ...body, key: body.key.toUpperCase(), isTerminal: body.isTerminal ?? false, organizationId: auth.organizationId } }); }
  @Roles('OWNER','ADMIN') @Patch('lead-statuses/:id') async updateStatus(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Body() body: UpdateStatusDto) { await this.db.leadStatus.findFirstOrThrow({ where: { id, organizationId: auth.organizationId } }); return this.db.leadStatus.update({ where: { id }, data: body }); }
  @Get('tags') tags(@CurrentAuth() auth: AuthContext) { return this.db.tag.findMany({ where: { organizationId: auth.organizationId }, orderBy: { name: 'asc' } }); }
  @Roles('OWNER','ADMIN','MANAGER') @Post('tags') createTag(@CurrentAuth() auth: AuthContext, @Body() body: CreateTagDto) { return this.db.tag.create({ data: { organizationId: auth.organizationId, name: body.name } }); }
}
