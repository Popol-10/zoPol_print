import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProfiles20261016000000 implements MigrationInterface {
  name = 'UserProfiles20261016000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_profiles (
        user_id CHAR(36) NOT NULL,
        phone VARCHAR(40) NULL,
        address VARCHAR(255) NULL,
        birth_date DATE NULL,
        about VARCHAR(500) NULL,
        profile_photo MEDIUMBLOB NULL,
        profile_photo_mime_type VARCHAR(32) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (user_id),
        CONSTRAINT FK_user_profiles_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE user_profiles');
  }
}
