import { MigrationInterface, QueryRunner } from 'typeorm';

export class Orders20260928000000 implements MigrationInterface {
  name = 'Orders20260928000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE orders (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        order_number VARCHAR(32) NOT NULL,
        client_id CHAR(36) NOT NULL,
        client_name VARCHAR(160) NOT NULL,
        client_company VARCHAR(160) NULL,
        product_id CHAR(36) NOT NULL,
        product_name VARCHAR(160) NOT NULL,
        product_reference VARCHAR(64) NOT NULL,
        machine VARCHAR(120) NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        unit_price DECIMAL(14,2) NOT NULL,
        total DECIMAL(14,2) NOT NULL,
        paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'Nouveau',
        priority VARCHAR(16) NOT NULL DEFAULT 'Normale',
        ordered_at DATETIME(6) NOT NULL,
        due_date DATE NULL,
        operator_name VARCHAR(120) NOT NULL DEFAULT 'À attribuer',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_orders_organization_number (organization_id, order_number),
        KEY IDX_orders_organization_ordered (organization_id, ordered_at),
        KEY IDX_orders_organization_status (organization_id, status),
        CONSTRAINT FK_orders_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_orders_client FOREIGN KEY (client_id)
          REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_orders_product FOREIGN KEY (product_id)
          REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE orders');
  }
}
