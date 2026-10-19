import { MigrationInterface, QueryRunner } from 'typeorm';

export class Attendance20260930000000 implements MigrationInterface {
  name = 'Attendance20260930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE attendance_records (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        employee_id CHAR(36) NOT NULL,
        attendance_date DATE NOT NULL,
        status ENUM('PRESENT', 'LATE', 'ABSENT', 'LEAVE') NOT NULL,
        check_in TIME NULL,
        check_out TIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_attendance_employee_date (employee_id, attendance_date),
        KEY IDX_attendance_organization_date (organization_id, attendance_date),
        CONSTRAINT FK_attendance_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_attendance_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE attendance_records');
  }
}
