import { Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentAuth, type AuthContext } from '../../common/auth-context.js';
import { DatabaseService } from '../../common/database.module.js';
import { Public } from '../../common/public.decorator.js';
import { Roles } from '../../common/roles.decorator.js';
import { MetaOAuthService } from './meta-oauth.service.js';
@Controller('v1/integrations')
export class MetaOAuthController {
  constructor(private readonly meta: MetaOAuthService, private readonly db: DatabaseService,private readonly config:ConfigService) {}
  @Get() list(@CurrentAuth() auth: AuthContext) { return this.db.integration.findMany({ where: { organizationId: auth.organizationId }, select: { id: true, provider: true, status: true, lastSuccessAt: true, lastErrorAt: true, createdAt: true, updatedAt: true } }); }
  @Roles('OWNER','ADMIN') @Post('meta/connect/start') start(@CurrentAuth() auth: AuthContext) { return this.meta.start(auth); }
  @Public() @Get('meta/callback') async callback(@Query('code') code: string, @Query('state') state: string,@Res()response:Response) { await this.meta.callback(code,state); response.redirect(303,this.config.getOrThrow<string>('META_MOBILE_REDIRECT_URI')); }
  @Get('meta/pages') pages(@CurrentAuth() auth: AuthContext) { return this.meta.pages(auth.organizationId); }
  @Get('meta/forms') forms(@CurrentAuth() auth: AuthContext) { return this.meta.forms(auth); }
  @Roles('OWNER','ADMIN') @Post('meta/pages/:id/select') select(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { return this.meta.selectPage(auth, id); }
  @Roles('OWNER','ADMIN') @Post('meta/forms/:id/enable') enable(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { return this.meta.enableForm(auth, id); }
  @Roles('OWNER','ADMIN') @Post('meta/reconnect') reconnect(@CurrentAuth() auth: AuthContext) { return this.meta.start(auth); }
  @Roles('OWNER','ADMIN') @Delete('meta') async disconnect(@CurrentAuth() auth: AuthContext) { await this.db.integration.updateMany({ where: { organizationId: auth.organizationId, provider: 'META' }, data: { status: 'DISCONNECTED', encryptedCredentials: null } }); await this.db.metaPage.updateMany({ where: { organizationId: auth.organizationId }, data: { status: 'DISABLED', accessTokenReference: null } }); return { disconnected: true }; }
}
