import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName: string;

  @IsEmail()
  @Length(5, 190)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  temporaryPassword: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
