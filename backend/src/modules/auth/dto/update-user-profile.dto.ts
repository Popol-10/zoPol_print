import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

const normalizeOptionalText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export class UpdateUserProfileDto extends UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 40, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(normalizeOptionalText)
  phone?: string | null;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(normalizeOptionalText)
  address?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', example: '1995-08-24', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La date de naissance doit respecter le format AAAA-MM-JJ.' })
  @Transform(normalizeOptionalText)
  birthDate?: string | null;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(normalizeOptionalText)
  about?: string | null;
}
