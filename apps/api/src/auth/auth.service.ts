import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../common/database.module.js';
import type { AuthContext } from '../common/auth-context.js';
import type { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './auth.dto.js';
import { EmailQueueService } from '../common/email-queue.module.js';

const DEFAULT_STATUSES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','WON','LOST'] as const;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService, private readonly jwt: JwtService, private readonly config: ConfigService,private readonly email:EmailQueueService) {}

  async signup(input: SignupDto) {
    if (await this.db.user.findUnique({ where: { email: input.email.toLowerCase() } })) throw new ConflictException('Email is already registered.');
    const slug = `${input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${randomUUID().slice(0, 8)}`;
    const passwordHash = await argon2.hash(input.password);
    const result = await this.db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: input.email.toLowerCase(), name: input.name, passwordHash } });
      const organization = await tx.organization.create({ data: { name: input.organizationName, slug,plan:{connect:{key:'STARTER'}} } });
      await tx.organizationUser.create({ data: { userId: user.id, organizationId: organization.id, role: 'OWNER' } });
      await tx.leadStatus.createMany({ data: DEFAULT_STATUSES.map((key, position) => ({ organizationId: organization.id, key, name: key[0] + key.slice(1).toLowerCase(), position, isTerminal: key === 'WON' || key === 'LOST' })) });
      return { user, organization };
    });
    return this.createSession(result.user.id, result.organization.id, 'OWNER');
  }

  async login(input: LoginDto) {
    const user = await this.db.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { memberships: { where: { status: 'ACTIVE' }, take: 1 } } });
    if (!user || !(await argon2.verify(user.passwordHash, input.password)) || !user.memberships[0]) throw new UnauthorizedException('Invalid email or password.');
    const membership = user.memberships[0];
    return this.createSession(user.id, membership.organizationId, membership.role);
  }

  async refresh(token: string) {
    let claims: AuthContext;
    try { claims = await this.jwt.verifyAsync<AuthContext>(token, { secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET') }); }
    catch { throw new UnauthorizedException('The refresh token is invalid or expired.'); }
    const session = await this.db.authSession.findUnique({ where: { id: claims.sessionId } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.refreshTokenHash !== hashToken(token)) {
      if (session && !session.revokedAt) await this.db.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('The refresh session is invalid or has been reused.');
    }
    const membership = await this.db.organizationUser.findUnique({ where: { organizationId_userId: { organizationId: claims.organizationId, userId: claims.userId } } });
    if (!membership || membership.status !== 'ACTIVE') throw new UnauthorizedException('Organization membership is no longer active.');
    return this.rotateSession(session.id, claims.userId, claims.organizationId, membership.role);
  }

  async logout(sessionId: string): Promise<{ success: true }> {
    await this.db.authSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  me(auth: AuthContext) {
    return this.db.organizationUser.findFirst({ where: { userId: auth.userId, organizationId: auth.organizationId, status: 'ACTIVE' }, select: { role: true, user: { select: { id: true, email: true, name: true, phone: true } }, organization: { select: { id: true, name: true, slug: true, timezone: true } } } });
  }
  async switchOrganization(userId:string,organizationId:string){const membership=await this.db.organizationUser.findUnique({where:{organizationId_userId:{organizationId,userId}}});if(!membership||membership.status!=='ACTIVE')throw new UnauthorizedException('Organization membership is not active.');return this.createSession(userId,organizationId,membership.role)}

  async forgotPassword(input: ForgotPasswordDto): Promise<{ accepted: true }> {
    const user = await this.db.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
      await this.email.enqueue(user.email,'PASSWORD_RESET',{name:user.name,resetUrl:`${this.config.getOrThrow('MOBILE_PUBLIC_URL')}reset-password?token=${encodeURIComponent(token)}`});
    }
    return { accepted: true };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ success: true }> {
    const record = await this.db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new UnauthorizedException('The reset token is invalid or expired.');
    await this.db.$transaction([
      this.db.user.update({ where: { id: record.userId }, data: { passwordHash: await argon2.hash(input.password) } }),
      this.db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.db.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return { success: true };
  }

  private async createSession(userId: string, organizationId: string, role: AuthContext['role']) {
    const session = await this.db.authSession.create({ data: { userId, organizationId, refreshTokenHash: 'pending', expiresAt: new Date(Date.now() + 30 * 86_400_000) } });
    return this.rotateSession(session.id, userId, organizationId, role);
  }

  private async rotateSession(sessionId: string, userId: string, organizationId: string, role: AuthContext['role']) {
    const claims = { userId, organizationId, sessionId, role };
    const accessToken = await this.jwt.signAsync(claims, { secret: this.config.getOrThrow('AUTH_SECRET'), expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync(claims, { secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'), expiresIn: '30d' });
    await this.db.authSession.update({ where: { id: sessionId }, data: { refreshTokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86_400_000) } });
    return { accessToken, refreshToken };
  }
}
