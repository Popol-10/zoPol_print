import { MigrationInterface, QueryRunner } from 'typeorm';

export class Clients20260926000000 implements MigrationInterface {
  name = 'Clients20260926000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      MODIFY COLUMN event VARCHAR(64) NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE clients (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(160) NOT NULL,
        company VARCHAR(160) NULL,
        phone VARCHAR(40) NULL,
        email VARCHAR(190) NULL,
        city VARCHAR(120) NULL,
        type ENUM('INDIVIDUAL', 'COMPANY', 'RESELLER') NOT NULL DEFAULT 'INDIVIDUAL',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY IDX_clients_organization_name (organization_id, name),
        KEY IDX_clients_organization_created (organization_id, created_at),
        CONSTRAINT FK_clients_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE clients');
    await queryRunner.query(`
      ALTER TABLE audit_logs
      MODIFY COLUMN event ENUM(
        'AUTH_REGISTERED',
        'AUTH_LOGGED_IN',
        'AUTH_REFRESHED',
        'AUTH_LOGGED_OUT',
        'AUTH_PASSWORD_CHANGED',
        'AUTH_PASSWORD_RESET_REQUESTED',
        'AUTH_PASSWORD_RESET_COMPLETED',
        'USER_ROLES_UPDATED',
        'USER_CREATED',
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED'
      ) NOT NULL
    `);
  }
}
