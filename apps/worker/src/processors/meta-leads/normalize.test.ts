import { describe, expect, it } from 'vitest';
import { normalizeMetaLead } from './normalize.js';
describe('normalizeMetaLead', () => {
  it('normalizes standard Meta fields and preserves raw data', () => { const raw = { id:'lead-1', form_id:'form-1', field_data:[{name:'full_name',values:['Ada Lovelace']},{name:'email',values:['ADA@EXAMPLE.COM']},{name:'phone_number',values:['+44123']}] }; expect(normalizeMetaLead(raw)).toMatchObject({externalId:'lead-1',name:'Ada Lovelace',email:'ada@example.com',phone:'+44123',formId:'form-1',raw}); });
  it('requires the provider deduplication id', () => { expect(() => normalizeMetaLead({field_data:[]})).toThrow(/id/); });
});
