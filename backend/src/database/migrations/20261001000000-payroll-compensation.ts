import { MigrationInterface, QueryRunner } from 'typeorm';

export class PayrollCompensation20261001000000 implements MigrationInterface {
  name = 'PayrollCompensation20261001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employee_compensations (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        employee_id CHAR(36) NOT NULL,
        monthly_base_salary INT UNSIGNED NOT NULL,
        effective_from DATE NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_employee_compensations_employee (employee_id),
        KEY IDX_employee_compensations_organization (organization_id),
        CONSTRAINT FK_employee_compensations_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_employee_compensations_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE employee_compensations');
  }
}
