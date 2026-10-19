import { UserRole } from '../../modules/users/entities/user-role.enum';
import { UserStatus } from '../../modules/users/entities/user-status.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: UserRole[];
}
