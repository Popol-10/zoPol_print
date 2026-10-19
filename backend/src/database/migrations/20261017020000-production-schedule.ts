import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionSchedule20261017020000 implements MigrationInterface {
  name = 'ProductionSchedule20261017020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE production_tasks
        ADD COLUMN scheduled_date DATE NULL AFTER employee_id,
        ADD COLUMN scheduled_start_time TIME NULL AFTER scheduled_date,
        ADD COLUMN scheduled_end_time TIME NULL AFTER scheduled_start_time,
        ADD KEY IDX_production_tasks_schedule (organization_id, scheduled_date, stage)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE production_tasks
        DROP INDEX IDX_production_tasks_schedule,
        DROP COLUMN scheduled_end_time,
        DROP COLUMN scheduled_start_time,
        DROP COLUMN scheduled_date
    `);
  }
}
