import { MigrationInterface, QueryRunner } from 'typeorm';

export class PurchaseReceipts20261017000000 implements MigrationInterface {
  name = 'PurchaseReceipts20261017000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE purchase_order_lines ADD COLUMN quantity_received INT UNSIGNED NOT NULL DEFAULT 0 AFTER quantity_ordered',
    );
    await queryRunner.query(
      "ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(24) NOT NULL DEFAULT 'ORDERED'",
    );

    await queryRunner.query(`
      CREATE TABLE purchase_receipts (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        purchase_order_id CHAR(36) NOT NULL,
        receipt_number VARCHAR(36) NOT NULL,
        delivery_reference VARCHAR(120) NULL,
        notes TEXT NULL,
        actor_id CHAR(36) NOT NULL,
        actor_name VARCHAR(160) NOT NULL,
        received_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_purchase_receipts_organization_number (organization_id, receipt_number),
        KEY IDX_purchase_receipts_organization_received (organization_id, received_at),
        CONSTRAINT FK_purchase_receipts_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_receipts_order FOREIGN KEY (purchase_order_id)
          REFERENCES purchase_orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_receipts_actor FOREIGN KEY (actor_id)
          REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE purchase_receipt_lines (
        id CHAR(36) NOT NULL,
        receipt_id CHAR(36) NOT NULL,
        purchase_order_line_id CHAR(36) NOT NULL,
        stock_item_id CHAR(36) NOT NULL,
        stock_movement_id CHAR(36) NOT NULL,
        item_name VARCHAR(160) NOT NULL,
        item_reference VARCHAR(64) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_purchase_receipt_lines_receipt_order_line (receipt_id, purchase_order_line_id),
        UNIQUE KEY UQ_purchase_receipt_lines_stock_movement (stock_movement_id),
        CONSTRAINT FK_purchase_receipt_lines_receipt FOREIGN KEY (receipt_id)
          REFERENCES purchase_receipts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_receipt_lines_order_line FOREIGN KEY (purchase_order_line_id)
          REFERENCES purchase_order_lines(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_receipt_lines_stock_item FOREIGN KEY (stock_item_id)
          REFERENCES stock_items(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_purchase_receipt_lines_stock_movement FOREIGN KEY (stock_movement_id)
          REFERENCES stock_movements(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE purchase_receipt_lines');
    await queryRunner.query('DROP TABLE purchase_receipts');
    await queryRunner.query(
      "ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(16) NOT NULL DEFAULT 'ORDERED'",
    );
    await queryRunner.query('ALTER TABLE purchase_order_lines DROP COLUMN quantity_received');
  }
}
