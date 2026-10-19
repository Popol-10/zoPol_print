import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user-role.enum';
import { UserStatus } from '../../users/entities/user-status.enum';

export class AuthenticatedUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];
}

export class TokensDto {
  @ApiProperty()
  tokenType: 'Bearer';

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: 900 })
  accessTokenExpiresIn: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthenticatedUserDto })
  user: AuthenticatedUserDto;

  @ApiProperty({ type: TokensDto })
  tokens: TokensDto;
}
