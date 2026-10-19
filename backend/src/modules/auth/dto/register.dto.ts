import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, Matches } from 'class-validator';

export class RegisterDto {
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

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  @Matches(/.*\S.*/, { message: "Le nom de l'organisation ne peut pas être vide." })
  @Transform(({ value }: { value: string }) => value?.trim())
  organizationName: string;
}
