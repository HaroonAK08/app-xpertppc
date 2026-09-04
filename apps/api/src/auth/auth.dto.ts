import { IsEmail, IsString, MinLength } from 'class-validator';
export class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(12) password!: string;
  @IsString() @MinLength(2) organizationName!: string;
}
export class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
export class RefreshDto { @IsString() refreshToken!: string; }
export class ForgotPasswordDto { @IsEmail() email!: string; }
export class ResetPasswordDto { @IsString() token!: string; @IsString() @MinLength(12) password!: string; }
