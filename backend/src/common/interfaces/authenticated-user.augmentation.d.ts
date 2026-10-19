import { UserStatus } from '../../modules/users/entities/user-status.enum';

declare module './authenticated-user.interface' {
  interface AuthenticatedUser {
    firstName: string;
    lastName: string;
    status: UserStatus;
  }
}

export {};
