import { MigrationInterface, QueryRunner } from 'typeorm';

export class BankReconciliation20261001040000 implements MigrationInterface {
  name = 'BankReconciliation20261001040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE bank_reconciliations (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        statement_opening_balance DECIMAL(14, 0) NOT NULL,
        statement_closing_balance DECIMAL(14, 0) NOT NULL,
        status ENUM('OPEN', 'RECONCILED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        completed_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY IDX_bank_reconciliation_organization_period (organization_id, period_start, period_end),
        KEY IDX_bank_reconciliation_organization_status (organization_id, status),
        CONSTRAINT FK_bank_reconciliation_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        ADD reconciliation_id CHAR(36) NULL AFTER transfer_id,
        ADD KEY IDX_finance_reconciliation (reconciliation_id),
        ADD CONSTRAINT FK_finance_transactions_reconciliation FOREIGN KEY (reconciliation_id)
          REFERENCES bank_reconciliations(id) ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        DROP FOREIGN KEY FK_finance_transactions_reconciliation,
        DROP INDEX IDX_finance_reconciliation,
        DROP COLUMN reconciliation_id
    `);
    await queryRunner.query('DROP TABLE bank_reconciliations');
  }
}
