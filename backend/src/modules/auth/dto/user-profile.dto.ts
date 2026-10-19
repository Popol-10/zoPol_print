import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserDto } from './auth-response.dto';

export class UserProfileDto extends AuthenticatedUserDto {
  @ApiProperty()
  organizationName: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty({ nullable: true, example: '1995-08-24' })
  birthDate: string | null;

  @ApiProperty({ nullable: true, maxLength: 500 })
  about: string | null;

  @ApiProperty()
  hasProfilePhoto: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  lastLoginAt: Date | null;
}

export class ProfilePhotoStatusDto {
  @ApiProperty()
  hasProfilePhoto: boolean;
}
