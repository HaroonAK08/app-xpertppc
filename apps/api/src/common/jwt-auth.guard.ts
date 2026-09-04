import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, AuthContext } from './auth-context.js';
import { IS_PUBLIC } from './public.decorator.js';
import { DatabaseService } from './database.module.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService, private readonly config: ConfigService,private readonly db:DatabaseService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new UnauthorizedException('Authentication is required.');
    try {
      const payload = await this.jwt.verifyAsync<AuthContext>(token, { secret: this.config.getOrThrow<string>('AUTH_SECRET') });
      if (!payload.userId || !payload.organizationId || !payload.sessionId || !payload.role) throw new Error('Invalid claims');
      const [session,membership]=await Promise.all([this.db.authSession.findFirst({where:{id:payload.sessionId,userId:payload.userId,organizationId:payload.organizationId,revokedAt:null,expiresAt:{gt:new Date()}}}),this.db.organizationUser.findUnique({where:{organizationId_userId:{organizationId:payload.organizationId,userId:payload.userId}}})]);
      if(!session||!membership||membership.status!=='ACTIVE')throw new Error('Revoked session');
      request.auth = {...payload,role:membership.role};
      return true;
    } catch { throw new UnauthorizedException('The access token is invalid or expired.'); }
  }
}
