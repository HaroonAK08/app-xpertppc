import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { Roles } from '../common/roles.decorator.js';
import { AddNoteDto, AddTagsDto, AssignLeadDto, LeadFiltersDto, UpdateLeadDto } from './leads.dto.js';
import { LeadsService } from './leads.service.js';
@Controller('v1/leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}
  @Get() list(@CurrentAuth() auth: AuthContext, @Query('limit', new ParseIntPipe({ optional: true })) limit: number | undefined, @Query() q: LeadFiltersDto) { return this.leads.list(auth, limit, q.cursor, q.search, q.statusId, q.assignedUserId, q.source, q.formId, q.campaignId,q.tagId,q.dateFrom,q.dateTo,q.sort); }
  @Get(':id') get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { return this.leads.get(auth.organizationId, id,auth.role==='AGENT'?auth.userId:undefined); }
  @Roles('OWNER','ADMIN','MANAGER','AGENT') @Patch(':id') update(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Body() body: UpdateLeadDto) { return this.leads.update(auth, id, body); }
  @Roles('OWNER','ADMIN','MANAGER') @Post(':id/assign') assign(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Body() body: AssignLeadDto) { return this.leads.assign(auth, id, body.userId); }
  @Roles('OWNER','ADMIN','MANAGER','AGENT') @Post(':id/notes') note(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Body() body: AddNoteDto) { return this.leads.note(auth, id, body.body); }
  @Get(':id/activity') activity(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { return this.leads.activityList(auth, id); }
  @Roles('OWNER','ADMIN','MANAGER','AGENT') @Post(':id/tags') addTags(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Body() body: AddTagsDto) { return this.leads.addTags(auth, id, body); }
  @Roles('OWNER','ADMIN','MANAGER','AGENT') @Delete(':id/tags/:tagId') removeTag(@CurrentAuth() auth: AuthContext, @Param('id') id: string, @Param('tagId') tagId: string) { return this.leads.removeTag(auth, id, tagId); }
}
