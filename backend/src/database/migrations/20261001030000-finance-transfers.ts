import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinanceTransfers20261001030000 implements MigrationInterface {
  name = 'FinanceTransfers20261001030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        MODIFY type ENUM(
          'INCOME', 'EXPENSE', 'OPENING_BALANCE', 'TRANSFER_OUT', 'TRANSFER_IN'
        ) NOT NULL,
        MODIFY category ENUM(
          'SALES', 'CLIENT_DEPOSIT', 'OTHER_INCOME', 'GENERAL_EXPENSE',
          'INTERNAL_PURCHASE', 'LOGISTICS', 'MAINTENANCE', 'OTHER_EXPENSE',
          'OPENING_BALANCE', 'ACCOUNT_TRANSFER'
        ) NOT NULL,
        ADD transfer_id CHAR(36) NULL AFTER order_id,
        ADD KEY IDX_finance_transfer (transfer_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM finance_transactions WHERE transfer_id IS NOT NULL');
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        DROP INDEX IDX_finance_transfer,
        DROP COLUMN transfer_id,
        MODIFY type ENUM('INCOME', 'EXPENSE', 'OPENING_BALANCE') NOT NULL,
        MODIFY category ENUM(
          'SALES', 'CLIENT_DEPOSIT', 'OTHER_INCOME', 'GENERAL_EXPENSE',
          'INTERNAL_PURCHASE', 'LOGISTICS', 'MAINTENANCE', 'OTHER_EXPENSE',
          'OPENING_BALANCE'
        ) NOT NULL
    `);
  }
}
