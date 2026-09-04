import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function context(role: string) {
  return { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ auth: { role } }) }) } as never;
}
describe('RolesGuard', () => {
  it('allows a listed backend role', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => ['OWNER', 'ADMIN'] } as never);
    expect(guard.canActivate(context('ADMIN'))).toBe(true);
  });
  it('rejects UI-only permission assumptions', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => ['OWNER'] } as never);
    expect(() => guard.canActivate(context('VIEWER'))).toThrow(ForbiddenException);
  });
});
