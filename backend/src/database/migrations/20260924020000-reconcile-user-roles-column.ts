import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repairs databases created with an early version of the auth schema where
 * `users.roles` was absent even though the initial migration was recorded.
 *
 * The migration is deliberately idempotent: fresh installations already have
 * the column and are left unchanged. On a legacy installation, every member
 * starts as VIEWER and the oldest member of each organization becomes its
 * bootstrap administrator, so role administration remains accessible.
 */
export class ReconcileUserRolesColumn20260924020000 implements MigrationInterface {
  name = 'ReconcileUserRolesColumn20260924020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ columnName: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME AS columnName
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'roles'
    `);

    if (columns.length > 0) return;

    await queryRunner.query(`
      ALTER TABLE users
      ADD roles VARCHAR(255) NOT NULL DEFAULT 'VIEWER' AFTER password_hash
    `);

    const organizations: Array<{ organizationId: string }> = await queryRunner.query(`
        SELECT DISTINCT organization_id AS organizationId
        FROM users
      `);

    for (const organization of organizations) {
      await queryRunner.query(
        `
          UPDATE users
          SET roles = 'ADMIN'
          WHERE organization_id = ?
          ORDER BY created_at ASC, id ASC
          LIMIT 1
        `,
        [organization.organizationId],
      );
    }
  }

  async down(): Promise<void> {
    // No-op: removing roles could permanently discard role assignments.
  }
}
