import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export const supportedOrganizationCurrencies = ['MGA', 'EUR', 'USD', 'GBP'] as const;
export const supportedOrganizationTimeZones = [
  'Indian/Antananarivo',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
] as const;

export class UpdateOrganizationSettingsDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  @Matches(/.*\S.*/, { message: 'Le nom de l’entreprise ne peut pas être vide.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value))
  address?: string | null;

  @ApiProperty({ enum: [...supportedOrganizationCurrencies], example: 'MGA' })
  @IsIn([...supportedOrganizationCurrencies])
  currency: (typeof supportedOrganizationCurrencies)[number];

  @ApiProperty({ enum: [...supportedOrganizationTimeZones], example: 'Indian/Antananarivo' })
  @IsIn([...supportedOrganizationTimeZones])
  timezone: (typeof supportedOrganizationTimeZones)[number];
}
