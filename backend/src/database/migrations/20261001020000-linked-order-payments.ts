import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkedOrderPayments20261001020000 implements MigrationInterface {
  name = 'LinkedOrderPayments20261001020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        ADD order_id CHAR(36) NULL AFTER organization_id,
        ADD KEY IDX_finance_order (order_id),
        ADD CONSTRAINT FK_finance_transactions_order FOREIGN KEY (order_id)
          REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance_transactions
        DROP FOREIGN KEY FK_finance_transactions_order,
        DROP INDEX IDX_finance_order,
        DROP COLUMN order_id
    `);
  }
}
