import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD,APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { DatabaseModule } from './common/database.module.js';
import { JwtAuthGuard } from './common/jwt-auth.guard.js';
import { RolesGuard } from './common/roles.guard.js';
import { TeamsModule } from './teams/teams.module.js';
import { CrmSettingsModule } from './crm-settings/crm-settings.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MetaModule } from './integrations/meta/meta.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { RateLimitGuard } from './common/rate-limit.guard.js';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor.js';
import { OperationsModule } from './operations/operations.module.js';
import { BillingModule } from './billing/billing.module.js';
import { AutomationsModule } from './automations/automations.module.js';
import { AdminModule } from './admin/admin.module.js';
import { EmailQueueModule } from './common/email-queue.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, EmailQueueModule, AuthModule, OrganizationsModule, LeadsModule, ContactsModule, TeamsModule, CrmSettingsModule, NotificationsModule, AuditModule, MetaModule, RealtimeModule, ConversationsModule, DashboardModule, OperationsModule, BillingModule, AutomationsModule, AdminModule, HealthModule],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR,useClass:RequestLoggingInterceptor },
  ],
})
export class AppModule {}
