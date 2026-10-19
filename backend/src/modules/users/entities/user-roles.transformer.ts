import { ValueTransformer } from 'typeorm';
import { UserRole } from './user-role.enum';

type StoredRoles = string | UserRole[] | null | undefined;

function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

/** Converts the MySQL comma-separated value to the application's role array. */
export const userRolesTransformer: ValueTransformer = {
  to(roles: UserRole[] | null | undefined): string {
    return roles?.length ? roles.join(',') : UserRole.VIEWER;
  },

  from(value: StoredRoles): UserRole[] {
    if (Array.isArray(value)) return value.filter(isUserRole);
    if (typeof value !== 'string') return [UserRole.VIEWER];

    const roles = value.split(',').filter(isUserRole);
    return roles.length > 0 ? roles : [UserRole.VIEWER];
  },
};
