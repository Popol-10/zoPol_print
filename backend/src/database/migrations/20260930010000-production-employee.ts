import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionEmployee20260930010000 implements MigrationInterface {
  name = 'ProductionEmployee20260930010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE production_tasks
        ADD COLUMN employee_id CHAR(36) NULL AFTER order_id,
        ADD KEY IDX_production_tasks_employee (employee_id),
        ADD CONSTRAINT FK_production_tasks_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE production_tasks
        DROP FOREIGN KEY FK_production_tasks_employee,
        DROP INDEX IDX_production_tasks_employee,
        DROP COLUMN employee_id
    `);
  }
}
