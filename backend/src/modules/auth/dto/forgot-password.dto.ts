import { Transform } from 'class-transformer';
import { IsEmail, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @Length(5, 190)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;
}
