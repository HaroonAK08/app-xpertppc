import { IsEmail, IsEnum,IsString } from 'class-validator';
import { Role } from '@lead-saas/database';
export class InviteMemberDto { @IsEmail() email!: string; @IsEnum(Role) role!: Role; }
export class UpdateMemberDto { @IsEnum(Role) role!: Role; }
export class AcceptInvitationDto{@IsString()token!:string;}
