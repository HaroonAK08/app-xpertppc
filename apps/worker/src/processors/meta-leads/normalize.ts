export type MetaField = { name?: string; values?: unknown[] };
export type MetaLeadPayload = { id?: string; created_time?: string; ad_id?: string; form_id?: string; field_data?: MetaField[] };
export type NormalizedLead = { externalId: string; name: string | undefined; email: string | undefined; phone: string | undefined; formId: string | undefined; adId: string | undefined; raw: MetaLeadPayload };
const first = (fields: Map<string,string>, key: string) => fields.get(key)?.trim() || undefined;
export function normalizeMetaLead(payload: MetaLeadPayload): NormalizedLead {
  if (!payload.id) throw new Error('Meta lead response did not contain an id');
  const fields = new Map<string,string>();
  for (const field of payload.field_data ?? []) { const value = field.values?.[0]; if (field.name && typeof value === 'string') fields.set(field.name.toLowerCase(), value); }
  const joined = [first(fields,'first_name'), first(fields,'last_name')].filter(Boolean).join(' ') || undefined;
  return { externalId: payload.id, name: first(fields,'full_name') ?? joined, email: first(fields,'email')?.toLowerCase(), phone: first(fields,'phone_number') ?? first(fields,'phone'), formId: payload.form_id, adId: payload.ad_id, raw: payload };
}
