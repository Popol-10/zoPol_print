import { userRolesTransformer } from './user-roles.transformer';
import { UserRole } from './user-role.enum';

describe('userRolesTransformer', () => {
  it('stores role arrays as a comma-separated MySQL value', () => {
    expect(userRolesTransformer.to([UserRole.ADMIN, UserRole.COMMERCIAL])).toBe('ADMIN,COMMERCIAL');
  });

  it('hydrates comma-separated database values as role arrays', () => {
    expect(userRolesTransformer.from('ADMIN,COMMERCIAL')).toEqual([UserRole.ADMIN, UserRole.COMMERCIAL]);
  });

  it('accepts a role array returned by TypeORM after an insert', () => {
    expect(userRolesTransformer.from([UserRole.ADMIN])).toEqual([UserRole.ADMIN]);
  });

  it('falls back to VIEWER for null or invalid stored values', () => {
    expect(userRolesTransformer.from(null)).toEqual([UserRole.VIEWER]);
    expect(userRolesTransformer.from('UNKNOWN')).toEqual([UserRole.VIEWER]);
  });
});
