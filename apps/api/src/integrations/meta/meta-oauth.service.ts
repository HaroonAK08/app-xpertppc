import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.module.js';
import type { AuthContext } from '../../common/auth-context.js';
import { CredentialCipher } from './credential-cipher.js';
import { MetaGraphService } from './meta-graph.service.js';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class MetaOAuthService {
  constructor(private readonly db: DatabaseService, private readonly graph: MetaGraphService, private readonly cipher: CredentialCipher) {}
  async start(auth: AuthContext) { const state = randomBytes(32).toString('base64url'); await this.db.oAuthState.create({ data: { organizationId: auth.organizationId, userId: auth.userId, provider: 'META', stateHash: digest(state), expiresAt: new Date(Date.now() + 10 * 60_000) } }); return { authorizationUrl: this.graph.authorizationUrl(state) }; }
  async callback(code: string, state: string) {
    const record = await this.db.oAuthState.findUnique({ where: { stateHash: digest(state) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new BadRequestException('OAuth state is invalid or expired.');
    await this.db.oAuthState.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    const token = await this.graph.exchangeCode(code); const pages = await this.graph.pages(token);
    const integration = await this.db.integration.upsert({ where: { organizationId_provider: { organizationId: record.organizationId, provider: 'META' } }, create: { organizationId: record.organizationId, provider: 'META', status: 'CONNECTED', encryptedCredentials: this.cipher.encrypt(token), lastSuccessAt: new Date() }, update: { status: 'CONNECTED', encryptedCredentials: this.cipher.encrypt(token), lastSuccessAt: new Date(), lastErrorAt: null } });
    for (const page of pages.data) await this.db.metaPage.upsert({ where: { organizationId_externalPageId: { organizationId: record.organizationId, externalPageId: page.id } }, create: { organizationId: record.organizationId, integrationId: integration.id, externalPageId: page.id, name: page.name, accessTokenReference: this.cipher.encrypt(page.access_token) }, update: { integrationId: integration.id, name: page.name, accessTokenReference: this.cipher.encrypt(page.access_token) } });
    return { connected: true, pages: pages.data.map(({id,name}) => ({ externalPageId: id, name })) };
  }
  pages(organizationId: string) { return this.db.metaPage.findMany({ where: { organizationId }, select: { id: true, externalPageId: true, name: true, status: true } }); }
  async selectPage(auth: AuthContext, id: string) { const page = await this.db.metaPage.findFirst({ where: { id, organizationId: auth.organizationId, integration: { status: 'CONNECTED' } } }); if (!page?.accessTokenReference) throw new NotFoundException('Meta Page was not found.'); await this.graph.subscribePage(page.externalPageId, this.cipher.decrypt(page.accessTokenReference)); await this.db.$transaction([this.db.metaPage.updateMany({ where: { organizationId: auth.organizationId }, data: { status: 'DISABLED' } }), this.db.metaPage.update({ where: { id: page.id }, data: { status: 'ACTIVE' } })]); return { selected: true }; }
  async forms(auth: AuthContext) { const page = await this.db.metaPage.findFirst({ where: { organizationId: auth.organizationId, status: 'ACTIVE' } }); if (!page?.accessTokenReference) throw new BadRequestException('Select a connected Page first.'); const forms = await this.graph.forms(page.externalPageId, this.cipher.decrypt(page.accessTokenReference)); for (const form of forms.data) await this.db.metaForm.upsert({ where: { organizationId_externalFormId: { organizationId: auth.organizationId, externalFormId: form.id } }, create: { organizationId: auth.organizationId, metaPageId: page.id, externalFormId: form.id, name: form.name ?? `Form ${form.id}` }, update: { metaPageId: page.id, name: form.name ?? `Form ${form.id}` } }); return this.db.metaForm.findMany({ where: { organizationId: auth.organizationId, metaPageId: page.id }, select: { id: true, externalFormId: true, name: true, status: true } }); }
  async enableForm(auth: AuthContext, id: string) { const form = await this.db.metaForm.findFirst({ where: { id, organizationId: auth.organizationId, page: { status: 'ACTIVE', integration: { status: 'CONNECTED' } } } }); if (!form) throw new NotFoundException('Meta Form was not found on the selected Page.'); return this.db.metaForm.update({ where: { id: form.id }, data: { status: 'ACTIVE' }, select: { id: true, name: true, status: true } }); }
}
