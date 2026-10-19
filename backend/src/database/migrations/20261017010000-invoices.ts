import { MigrationInterface, QueryRunner } from 'typeorm';

export class Invoices20261017010000 implements MigrationInterface {
  name = 'Invoices20261017010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE invoices (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        order_id CHAR(36) NOT NULL,
        invoice_number VARCHAR(32) NOT NULL,
        client_name VARCHAR(160) NOT NULL,
        client_company VARCHAR(160) NULL,
        issued_at DATE NOT NULL,
        total DECIMAL(14,2) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_invoices_organization_number (organization_id, invoice_number),
        UNIQUE KEY UQ_invoices_order (order_id),
        KEY IDX_invoices_organization_issued_at (organization_id, issued_at),
        CONSTRAINT FK_invoices_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_invoices_order FOREIGN KEY (order_id)
          REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE invoice_lines (
        id CHAR(36) NOT NULL,
        invoice_id CHAR(36) NOT NULL,
        product_name VARCHAR(160) NOT NULL,
        product_reference VARCHAR(64) NOT NULL,
        machine VARCHAR(120) NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        unit_price DECIMAL(14,2) NOT NULL,
        line_total DECIMAL(14,2) NOT NULL,
        PRIMARY KEY (id),
        KEY IDX_invoice_lines_invoice (invoice_id),
        CONSTRAINT FK_invoice_lines_invoice FOREIGN KEY (invoice_id)
          REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE invoice_lines');
    await queryRunner.query('DROP TABLE invoices');
  }
}
