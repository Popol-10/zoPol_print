import { MigrationInterface, QueryRunner } from 'typeorm';

export class Products20260926010000 implements MigrationInterface {
  name = 'Products20260926010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE products (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(160) NOT NULL,
        reference VARCHAR(64) NOT NULL,
        category ENUM('DTF', 'Textile', 'Laser', 'Acrylique', 'Bois', 'Personnalisation', 'Accessoires') NOT NULL,
        price DECIMAL(14,2) NOT NULL,
        cost DECIMAL(14,2) NOT NULL,
        stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
        unit VARCHAR(32) NOT NULL DEFAULT 'unité',
        machine VARCHAR(120) NOT NULL,
        duration VARCHAR(40) NOT NULL,
        color CHAR(7) NOT NULL DEFAULT '#fce7f3',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_products_organization_reference (organization_id, reference),
        KEY IDX_products_organization_category (organization_id, category),
        CONSTRAINT FK_products_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE products');
  }
}
