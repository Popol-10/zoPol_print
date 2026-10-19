import { IsString, IsStrongPassword, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(32, 512)
  token: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  newPassword: string;
}
