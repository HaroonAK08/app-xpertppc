import { Body, Controller, Get, NotFoundException, Param,Patch, Post } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { Roles } from '../common/roles.decorator.js';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.dto.js';
import { OrganizationsService } from './organizations.service.js';
import { AuthService } from '../auth/auth.service.js';
@Controller('v1/organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService,private readonly authService:AuthService) {}
  @Post() create(@CurrentAuth() auth: AuthContext, @Body() body: CreateOrganizationDto) { return this.organizations.create(auth, body); }
  @Get('current') async current(@CurrentAuth() auth: AuthContext) { const value = await this.organizations.current(auth); if (!value) throw new NotFoundException('Organization was not found.'); return value; }
  @Roles('OWNER','ADMIN') @Patch('current') update(@CurrentAuth() auth: AuthContext, @Body() body: UpdateOrganizationDto) { return this.organizations.update(auth, body); }
  @Get() list(@CurrentAuth()auth:AuthContext){return this.organizations.list(auth.userId)}
  @Post(':id/switch')switchOrganization(@CurrentAuth()auth:AuthContext,@Param('id')id:string){return this.authService.switchOrganization(auth.userId,id)}
}
