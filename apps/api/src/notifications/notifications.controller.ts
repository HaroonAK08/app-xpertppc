import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { DatabaseService } from '../common/database.module.js';
import { RegisterDeviceDto } from './notifications.dto.js';
@Controller('v1')
export class NotificationsController {
  constructor(private readonly db: DatabaseService) {}
  @Post('devices/register') register(@CurrentAuth() auth: AuthContext, @Body() body: RegisterDeviceDto) { return this.db.deviceToken.upsert({ where: { pushToken: body.pushToken }, create: { userId: auth.userId, platform: body.platform, pushToken: body.pushToken }, update: { userId: auth.userId, platform: body.platform, lastSeenAt: new Date() }, select: { id: true, platform: true, lastSeenAt: true } }); }
  @Delete('devices/:id') async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { await this.db.deviceToken.deleteMany({ where: { id, userId: auth.userId } }); return { success: true }; }
  @Get('notifications') list(@CurrentAuth() auth: AuthContext) { return this.db.notification.findMany({ where: { organizationId: auth.organizationId, userId: auth.userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  @Post('notifications/:id/read') async read(@CurrentAuth() auth: AuthContext, @Param('id') id: string) { await this.db.notification.updateMany({ where: { id, organizationId: auth.organizationId, userId: auth.userId }, data: { readAt: new Date() } }); return { success: true }; }
  @Post('notifications/read-all') async readAll(@CurrentAuth() auth: AuthContext) { await this.db.notification.updateMany({ where: { organizationId: auth.organizationId, userId: auth.userId, readAt: null }, data: { readAt: new Date() } }); return { success: true }; }
}
