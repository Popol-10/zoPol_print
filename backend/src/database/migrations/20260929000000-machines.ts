import { MigrationInterface, QueryRunner } from 'typeorm';

export class Machines20260929000000 implements MigrationInterface {
  name = 'Machines20260929000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE machines (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        name VARCHAR(120) NOT NULL,
        machine_type VARCHAR(80) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_machines_organization_name (organization_id, name),
        KEY IDX_machines_organization_status (organization_id, status),
        CONSTRAINT FK_machines_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      INSERT INTO machines (id, organization_id, name, machine_type, status)
      SELECT UUID(), organization_id, TRIM(machine), TRIM(machine), 'ACTIVE'
      FROM products
      WHERE TRIM(machine) <> ''
      GROUP BY organization_id, TRIM(machine)
    `);
    await queryRunner.query(`
      CREATE TABLE machine_maintenances (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        machine_id CHAR(36) NOT NULL,
        scheduled_for DATE NOT NULL,
        kind VARCHAR(16) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'PLANNED',
        description VARCHAR(512) NOT NULL,
        previous_machine_status VARCHAR(16) NULL,
        completed_at DATETIME(6) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_machine_maintenances_organization_date_status (organization_id, scheduled_for, status),
        CONSTRAINT FK_machine_maintenances_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_machine_maintenances_machine FOREIGN KEY (machine_id)
          REFERENCES machines(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE machine_maintenances');
    await queryRunner.query('DROP TABLE machines');
  }
}
