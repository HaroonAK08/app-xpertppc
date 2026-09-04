import { Module } from '@nestjs/common';
import { CrmSettingsController } from './crm-settings.controller.js';
@Module({ controllers: [CrmSettingsController] })
export class CrmSettingsModule {}
