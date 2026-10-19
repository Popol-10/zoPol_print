import { MigrationInterface, QueryRunner } from 'typeorm';

export class Suppliers20260926020000 implements MigrationInterface {
  name = 'Suppliers20260926020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE suppliers (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(160) NOT NULL,
        category VARCHAR(80) NOT NULL,
        contact_name VARCHAR(120) NULL,
        phone VARCHAR(40) NULL,
        email VARCHAR(190) NULL,
        city VARCHAR(120) NULL,
        notes TEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY IDX_suppliers_organization_name (organization_id, name),
        CONSTRAINT FK_suppliers_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE suppliers');
  }
}
