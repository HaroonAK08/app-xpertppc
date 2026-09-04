import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { Roles } from '../common/roles.decorator.js';
import { AcceptInvitationDto,InviteMemberDto, UpdateMemberDto } from './teams.dto.js';
import { TeamsService } from './teams.service.js';
@Controller('v1/team')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}
  @Roles('OWNER','ADMIN','MANAGER') @Get() list(@CurrentAuth() auth: AuthContext) { return this.teams.list(auth.organizationId); }
  @Roles('OWNER','ADMIN') @Post('invite') invite(@CurrentAuth() auth: AuthContext, @Body() body: InviteMemberDto) { return this.teams.invite(auth, body.email, body.role); }
  @Roles('OWNER','ADMIN') @Patch(':userId') update(@CurrentAuth() auth: AuthContext, @Param('userId') userId: string, @Body() body: UpdateMemberDto) { return this.teams.update(auth, userId, body.role); }
  @Roles('OWNER','ADMIN') @Delete(':userId') remove(@CurrentAuth() auth: AuthContext, @Param('userId') userId: string) { return this.teams.remove(auth, userId); }
  @Post('invitations/accept')accept(@CurrentAuth()auth:AuthContext,@Body()body:AcceptInvitationDto){return this.teams.accept(auth,body.token)}
}
