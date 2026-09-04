import { describe, expect, it } from 'vitest';
import { CredentialCipher } from './credential-cipher.js';
describe('CredentialCipher', () => {
  it('round trips without exposing plaintext', () => { const cipher = new CredentialCipher({ getOrThrow: () => Buffer.alloc(32, 7).toString('base64') } as never); const encrypted = cipher.encrypt('secret-token'); expect(encrypted).not.toContain('secret-token'); expect(cipher.decrypt(encrypted)).toBe('secret-token'); });
  it('rejects tampering', () => { const cipher = new CredentialCipher({ getOrThrow: () => Buffer.alloc(32, 7).toString('base64') } as never); const encrypted = cipher.encrypt('secret-token'); expect(() => cipher.decrypt(`${encrypted.slice(0,-1)}A`)).toThrow(); });
});
