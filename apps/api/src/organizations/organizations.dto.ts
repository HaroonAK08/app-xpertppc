import { IsString, IsTimeZone, Length } from 'class-validator';
export class CreateOrganizationDto { @IsString() @Length(2, 100) name!: string; }
export class UpdateOrganizationDto {
  @IsString() @Length(2, 100) name!: string;
  @IsTimeZone() timezone!: string;
}
