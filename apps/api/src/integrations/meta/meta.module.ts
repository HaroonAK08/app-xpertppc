import { Module } from '@nestjs/common';
import { MetaQueueService } from './meta-queue.service.js';
import { MetaWebhookController } from './meta-webhook.controller.js';
import { MetaWebhookVerifier } from './meta-webhook-verifier.js';
import { CredentialCipher } from './credential-cipher.js';
import { MetaGraphService } from './meta-graph.service.js';
import { MetaOAuthController } from './meta-oauth.controller.js';
import { MetaOAuthService } from './meta-oauth.service.js';
@Module({ controllers: [MetaWebhookController, MetaOAuthController], providers: [MetaQueueService, MetaWebhookVerifier, CredentialCipher, MetaGraphService, MetaOAuthService] })
export class MetaModule {}
