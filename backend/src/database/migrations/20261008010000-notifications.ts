import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications20261008010000 implements MigrationInterface {
  name = 'Notifications20261008010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notification_preferences (
        user_id CHAR(36) NOT NULL,
        low_stock_enabled TINYINT(1) NOT NULL DEFAULT 1,
        order_due_enabled TINYINT(1) NOT NULL DEFAULT 1,
        maintenance_enabled TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (user_id),
        CONSTRAINT FK_notification_preferences_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE notification_reads (
        user_id CHAR(36) NOT NULL,
        notification_id VARCHAR(190) NOT NULL,
        read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (user_id, notification_id),
        CONSTRAINT FK_notification_reads_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE notification_reads');
    await queryRunner.query('DROP TABLE notification_preferences');
  }
}
