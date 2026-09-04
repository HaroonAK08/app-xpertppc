import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth-context.js';
import { ROLES_KEY, type Role } from './roles.decorator.js';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!allowed?.length) return true;
    const role = context.switchToHttp().getRequest<AuthenticatedRequest>().auth?.role;
    if (!role || !allowed.includes(role)) throw new ForbiddenException('You do not have permission to perform this action.');
    return true;
  }
}
