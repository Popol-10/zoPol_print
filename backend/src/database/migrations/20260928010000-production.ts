import { MigrationInterface, QueryRunner } from 'typeorm';

export class Production20260928010000 implements MigrationInterface {
  name = 'Production20260928010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE production_tasks (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        order_id CHAR(36) NOT NULL,
        operator_name VARCHAR(120) NOT NULL DEFAULT 'À attribuer',
        stage VARCHAR(32) NOT NULL DEFAULT 'À produire',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_production_tasks_order (order_id),
        KEY IDX_production_tasks_organization_stage (organization_id, stage),
        CONSTRAINT FK_production_tasks_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_production_tasks_order FOREIGN KEY (order_id)
          REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE production_tasks');
  }
}
