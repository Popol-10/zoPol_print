import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinanceTransactions20261001010000 implements MigrationInterface {
  name = 'FinanceTransactions20261001010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE finance_transactions (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        type ENUM('INCOME', 'EXPENSE', 'OPENING_BALANCE') NOT NULL,
        label VARCHAR(160) NOT NULL,
        category ENUM(
          'SALES',
          'CLIENT_DEPOSIT',
          'OTHER_INCOME',
          'GENERAL_EXPENSE',
          'INTERNAL_PURCHASE',
          'LOGISTICS',
          'MAINTENANCE',
          'OTHER_EXPENSE',
          'OPENING_BALANCE'
        ) NOT NULL,
        method ENUM('CASH', 'BANK', 'MOBILE_MONEY') NOT NULL,
        amount DECIMAL(14, 0) NOT NULL,
        transaction_date DATE NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_finance_organization_date (organization_id, transaction_date),
        KEY IDX_finance_organization_method_date (organization_id, method, transaction_date),
        KEY IDX_finance_organization_type_date (organization_id, type, transaction_date),
        CONSTRAINT FK_finance_transactions_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE finance_transactions');
  }
}
