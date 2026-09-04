import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
export class CreateStatusDto { @IsString() @Length(1, 50) name!: string; @IsString() @Length(1, 50) key!: string; @IsInt() @Min(0) position!: number; @IsOptional() @IsBoolean() isTerminal?: boolean; }
export class UpdateStatusDto { @IsOptional() @IsString() @Length(1, 50) name?: string; @IsOptional() @IsInt() @Min(0) position?: number; @IsOptional() @IsBoolean() isTerminal?: boolean; }
export class CreateTagDto { @IsString() @Length(1, 50) name!: string; }
