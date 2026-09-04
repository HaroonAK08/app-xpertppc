import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentAuth, type AuthContext } from '../common/auth-context.js';
import { Public } from '../common/public.decorator.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto, LoginDto, RefreshDto, ResetPasswordDto, SignupDto } from './auth.dto.js';
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('signup') signup(@Body() body: SignupDto) { return this.auth.signup(body); }
  @Public() @Post('login') login(@Body() body: LoginDto) { return this.auth.login(body); }
  @Public() @Post('refresh') refresh(@Body() body: RefreshDto) { return this.auth.refresh(body.refreshToken); }
  @Post('logout') logout(@CurrentAuth() auth: AuthContext) { return this.auth.logout(auth.sessionId); }
  @Get('me') me(@CurrentAuth() auth: AuthContext) { return this.auth.me(auth); }
  @Public() @Post('forgot-password') forgot(@Body() body: ForgotPasswordDto) { return this.auth.forgotPassword(body); }
  @Public() @Post('reset-password') reset(@Body() body: ResetPasswordDto) { return this.auth.resetPassword(body); }
}
