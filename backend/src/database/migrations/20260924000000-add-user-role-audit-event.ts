import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAuditEvent20260924000000 implements MigrationInterface {
  name = 'AddUserRoleAuditEvent20260924000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      MODIFY event ENUM(
        'AUTH_REGISTERED',
        'AUTH_LOGGED_IN',
        'AUTH_REFRESHED',
        'AUTH_LOGGED_OUT',
        'AUTH_PASSWORD_CHANGED',
        'AUTH_PASSWORD_RESET_REQUESTED',
        'AUTH_PASSWORD_RESET_COMPLETED',
        'USER_ROLES_UPDATED'
      ) NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      MODIFY event ENUM(
        'AUTH_REGISTERED',
        'AUTH_LOGGED_IN',
        'AUTH_REFRESHED',
        'AUTH_LOGGED_OUT',
        'AUTH_PASSWORD_CHANGED',
        'AUTH_PASSWORD_RESET_REQUESTED',
        'AUTH_PASSWORD_RESET_COMPLETED'
      ) NOT NULL
    `);
  }
}
