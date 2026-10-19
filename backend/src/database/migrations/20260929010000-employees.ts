import { MigrationInterface, QueryRunner } from 'typeorm';

export class Employees20260929010000 implements MigrationInterface {
  name = 'Employees20260929010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employees (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(160) NOT NULL,
        position VARCHAR(120) NOT NULL,
        phone VARCHAR(40) NULL,
        email VARCHAR(190) NULL,
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY IDX_employees_organization_name (organization_id, name),
        KEY IDX_employees_organization_status (organization_id, status),
        CONSTRAINT FK_employees_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE employees');
  }
}
