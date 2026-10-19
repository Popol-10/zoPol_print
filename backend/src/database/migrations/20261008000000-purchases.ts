import { MigrationInterface, QueryRunner } from 'typeorm';

export class Purchases20261008000000 implements MigrationInterface {
  name = 'Purchases20261008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE purchase_orders (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        purchase_number VARCHAR(32) NOT NULL,
        supplier_id CHAR(36) NOT NULL,
        supplier_name VARCHAR(160) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'ORDERED',
        expected_date DATE NULL,
        notes TEXT NULL,
        total DECIMAL(14,2) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_purchase_orders_organization_number (organization_id, purchase_number),
        KEY IDX_purchase_orders_organization_status_created (organization_id, status, created_at),
        CONSTRAINT FK_purchase_orders_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_orders_supplier FOREIGN KEY (supplier_id)
          REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE purchase_order_lines (
        id CHAR(36) NOT NULL,
        purchase_order_id CHAR(36) NOT NULL,
        stock_item_id CHAR(36) NOT NULL,
        item_name VARCHAR(160) NOT NULL,
        item_reference VARCHAR(64) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        quantity_ordered INT UNSIGNED NOT NULL,
        unit_cost DECIMAL(14,2) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_purchase_order_lines_order_item (purchase_order_id, stock_item_id),
        KEY IDX_purchase_order_lines_stock_item (stock_item_id),
        CONSTRAINT FK_purchase_order_lines_order FOREIGN KEY (purchase_order_id)
          REFERENCES purchase_orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_order_lines_stock_item FOREIGN KEY (stock_item_id)
          REFERENCES stock_items(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE purchase_order_lines');
    await queryRunner.query('DROP TABLE purchase_orders');
  }
}
