import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthContext { userId: string; organizationId: string; sessionId: string; role: 'OWNER'|'ADMIN'|'MANAGER'|'AGENT'|'VIEWER' }
export interface AuthenticatedRequest extends Request { auth: AuthContext; requestId: string }
export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext =>
  ctx.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
