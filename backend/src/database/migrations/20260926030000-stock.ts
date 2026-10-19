import { MigrationInterface, QueryRunner } from 'typeorm';

export class Stock20260926030000 implements MigrationInterface {
  name = 'Stock20260926030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE stock_items (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(160) NOT NULL,
        reference VARCHAR(64) NOT NULL,
        category VARCHAR(80) NOT NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 0,
        minimum_quantity INT UNSIGNED NOT NULL DEFAULT 0,
        unit VARCHAR(32) NOT NULL DEFAULT 'unité',
        unit_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_stock_items_organization_reference (organization_id, reference),
        KEY IDX_stock_items_organization_name (organization_id, name),
        CONSTRAINT FK_stock_items_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE stock_movements (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        item_id CHAR(36) NOT NULL,
        kind VARCHAR(16) NOT NULL,
        delta INT NOT NULL,
        before_quantity INT UNSIGNED NOT NULL,
        after_quantity INT UNSIGNED NOT NULL,
        actor_id CHAR(36) NOT NULL,
        actor_name VARCHAR(160) NOT NULL,
        source VARCHAR(160) NULL,
        notes TEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_stock_movements_organization_created (organization_id, created_at),
        KEY IDX_stock_movements_item_created (item_id, created_at),
        CONSTRAINT FK_stock_movements_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_stock_movements_item FOREIGN KEY (item_id)
          REFERENCES stock_items(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE stock_movements');
    await queryRunner.query('DROP TABLE stock_items');
  }
}
