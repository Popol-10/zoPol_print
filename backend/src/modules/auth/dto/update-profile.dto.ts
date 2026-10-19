import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  @Matches(/.*\S.*/, { message: 'Le prénom ne peut pas être vide.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  @Matches(/.*\S.*/, { message: 'Le nom ne peut pas être vide.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  lastName: string;
}
