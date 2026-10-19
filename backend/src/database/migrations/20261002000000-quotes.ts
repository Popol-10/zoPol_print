import { MigrationInterface, QueryRunner } from 'typeorm';

export class Quotes20261002000000 implements MigrationInterface {
  name = 'Quotes20261002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE quotes (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        quote_number VARCHAR(32) NOT NULL,
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
        status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
        valid_until DATE NOT NULL,
        note TEXT NULL,
        order_id CHAR(36) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_quotes_organization_number (organization_id, quote_number),
        UNIQUE KEY UQ_quotes_order (order_id),
        KEY IDX_quotes_organization_status_created (organization_id, status, created_at),
        CONSTRAINT FK_quotes_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_quotes_client FOREIGN KEY (client_id)
          REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_quotes_product FOREIGN KEY (product_id)
          REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_quotes_order FOREIGN KEY (order_id)
          REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE quotes');
  }
}
