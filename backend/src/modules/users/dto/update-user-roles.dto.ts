import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
