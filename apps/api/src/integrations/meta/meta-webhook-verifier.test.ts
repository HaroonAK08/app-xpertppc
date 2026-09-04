import { createHmac } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MetaWebhookVerifier } from './meta-webhook-verifier.js';
describe('MetaWebhookVerifier', () => {
  const verifier = new MetaWebhookVerifier();
  it('returns only a correctly authenticated challenge', () => { expect(verifier.verifyChallenge('subscribe','secret','123','secret')).toBe('123'); expect(() => verifier.verifyChallenge('subscribe','wrong','123','secret')).toThrow(ForbiddenException); });
  it('accepts a valid sha256 signature and rejects tampering', () => { const body = Buffer.from('{"object":"page"}'); const secret = 'app-secret'; const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`; expect(() => verifier.verifySignature(body, signature, secret)).not.toThrow(); expect(() => verifier.verifySignature(Buffer.from('tampered'), signature, secret)).toThrow(ForbiddenException); });
});
