import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class CredentialCipher {
  private readonly key: Buffer;
  constructor(config: ConfigService) {
    const value = config.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = /^[a-f0-9]{64}$/i.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64');
    if (this.key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  encrypt(value: string): string { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key, iv); const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.'); }
  decrypt(value: string): string { const [version, iv, tag, ciphertext] = value.split('.'); if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Encrypted credential has an invalid envelope'); const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url')); decipher.setAuthTag(Buffer.from(tag, 'base64url')); return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8'); }
}
