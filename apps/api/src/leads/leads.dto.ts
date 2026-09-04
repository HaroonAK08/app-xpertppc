import { IsArray, IsDateString, IsEmail, IsEnum, IsIn, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
import { LeadSource } from '@lead-saas/database';
export class UpdateLeadDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsPhoneNumber() phone?: string;
  @IsOptional() @IsString() statusId?: string;
}
export class AssignLeadDto { @IsString() userId!: string; }
export class AddNoteDto { @IsString() @MaxLength(10_000) body!: string; }
export class AddTagsDto { @IsArray() @IsString({ each: true }) tagIds!: string[]; }
export class LeadFiltersDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() statusId?: string;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsString() formId?: string;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() tagId?:string;
  @IsOptional() @IsDateString() dateFrom?:string;
  @IsOptional() @IsDateString() dateTo?:string;
  @IsOptional() @IsIn(['newest','oldest']) sort?:'newest'|'oldest';
}
