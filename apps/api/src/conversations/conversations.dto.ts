import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class ConversationFiltersDto { @IsOptional() @IsIn(['all','unread','mine']) filter?:'all'|'unread'|'mine'; @IsOptional() @IsString() cursor?:string; }
export class SendMessageDto { @IsString() @MaxLength(2000) content!:string; }
export class UpdateConversationDto { @IsOptional() @IsString() assignedUserId?:string; @IsOptional() @IsIn(['OPEN','CLOSED']) status?:'OPEN'|'CLOSED'; }
