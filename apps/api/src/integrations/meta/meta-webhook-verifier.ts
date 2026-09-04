import { createHmac, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class MetaWebhookVerifier {
  verifyChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined, expectedToken: string): string {
    if (mode !== 'subscribe' || !token || !challenge || !this.safeEqual(token, expectedToken)) throw new ForbiddenException('Webhook verification failed.');
    return challenge;
  }

  verifySignature(rawBody: Buffer | undefined, signatureHeader: string | undefined, appSecret: string): void {
    if (!rawBody || !signatureHeader?.startsWith('sha256=')) throw new ForbiddenException('Webhook signature is missing.');
    const supplied = signatureHeader.slice(7);
    if (!/^[a-f0-9]{64}$/i.test(supplied)) throw new ForbiddenException('Webhook signature is invalid.');
    const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    if (!this.safeEqual(supplied.toLowerCase(), expected)) throw new ForbiddenException('Webhook signature is invalid.');
  }

  private safeEqual(left: string, right: string): boolean {
    const a = Buffer.from(left); const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
