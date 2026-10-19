import { MigrationInterface, QueryRunner } from 'typeorm';

export class HrTasks20260930020000 implements MigrationInterface {
  name = 'HrTasks20260930020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employee_tasks (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        employee_id CHAR(36) NULL,
        title VARCHAR(160) NOT NULL,
        description TEXT NULL,
        due_date DATE NOT NULL,
        status ENUM('TODO', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'TODO',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY IDX_employee_tasks_organization_due (organization_id, due_date),
        KEY IDX_employee_tasks_employee (employee_id),
        CONSTRAINT FK_employee_tasks_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_employee_tasks_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE employee_tasks');
  }
}
