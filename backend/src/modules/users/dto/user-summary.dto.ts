import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user-role.enum';
import { UserStatus } from '../entities/user-status.enum';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];

  @ApiProperty()
  createdAt: Date;
}
