import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MetaGraphService {
  readonly version: string;
  constructor(private readonly config: ConfigService) { this.version = config.getOrThrow<string>('META_GRAPH_VERSION'); if (!/^v\d+\.\d+$/.test(this.version)) throw new Error('META_GRAPH_VERSION must look like v25.0'); }
  authorizationUrl(state: string): string { const url = new URL(`https://www.facebook.com/${this.version}/dialog/oauth`); url.search = new URLSearchParams({ client_id: this.config.getOrThrow('META_APP_ID'), redirect_uri: this.config.getOrThrow('META_REDIRECT_URI'), state, scope: this.config.getOrThrow('META_OAUTH_SCOPES'), response_type: 'code' }).toString(); return url.toString(); }
  async exchangeCode(code: string): Promise<string> { const url = this.url('oauth/access_token', { client_id: this.config.getOrThrow('META_APP_ID'), client_secret: this.config.getOrThrow('META_APP_SECRET'), redirect_uri: this.config.getOrThrow('META_REDIRECT_URI'), code }); const data = await this.request<{access_token?:string}>(url); if (!data.access_token) throw new BadGatewayException('Meta did not return an access token.'); return data.access_token; }
  pages(token: string) { return this.get<{data:Array<{id:string;name:string;access_token:string}>}>('me/accounts', token, { fields: 'id,name,access_token' }); }
  forms(pageId: string, token: string) { return this.get<{data:Array<{id:string;name?:string;status?:string}>}>(`${pageId}/leadgen_forms`, token, { fields: 'id,name,status' }); }
  subscribePage(pageId: string, token: string) { return this.post(`${pageId}/subscribed_apps`, token, { subscribed_fields: 'leadgen' }); }
  lead(leadId: string, token: string) { return this.get<Record<string, unknown>>(leadId, token, { fields: 'id,created_time,ad_id,form_id,field_data' }); }
  private get<T>(path: string, token: string, query: Record<string,string>) { return this.request<T>(this.url(path, query), { headers: { authorization: `Bearer ${token}` } }); }
  private post(path: string, token: string, body: Record<string,string>) { return this.request<Record<string,unknown>>(this.url(path), { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) }); }
  private url(path: string, query: Record<string,string> = {}) { const url = new URL(`https://graph.facebook.com/${this.version}/${path}`); url.search = new URLSearchParams(query).toString(); return url; }
  private async request<T>(url: URL, init?: RequestInit): Promise<T> { const response = await fetch(url, init); const body = await response.json() as T & {error?:{message?:string}}; if (!response.ok || body.error) throw new BadGatewayException('Meta request failed. Reconnect the integration or try again later.'); return body; }
}
