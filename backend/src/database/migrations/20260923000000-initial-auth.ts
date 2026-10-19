import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuth20260923000000 implements MigrationInterface {
  name = 'InitialAuth20260923000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organizations (
        id CHAR(36) NOT NULL,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(140) NOT NULL,
        timezone VARCHAR(64) NOT NULL DEFAULT 'Indian/Antananarivo',
        currency VARCHAR(3) NOT NULL DEFAULT 'MGA',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_organizations_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NOT NULL,
        first_name VARCHAR(80) NOT NULL,
        last_name VARCHAR(80) NOT NULL,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        roles VARCHAR(255) NOT NULL DEFAULT 'VIEWER',
        status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
        email_verified_at DATETIME(6) NULL,
        last_login_at DATETIME(6) NULL,
        password_changed_at DATETIME(6) NULL,
        refresh_token_hash VARCHAR(255) NULL,
        refresh_token_expires_at DATETIME(6) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_users_email (email),
        KEY IDX_users_organization_status (organization_id, status),
        CONSTRAINT FK_users_organization FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME(6) NOT NULL,
        used_at DATETIME(6) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_password_reset_tokens_hash (token_hash),
        KEY IDX_password_reset_tokens_user_used (user_id, used_at),
        CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id CHAR(36) NOT NULL,
        organization_id CHAR(36) NULL,
        actor_id CHAR(36) NULL,
        event ENUM(
          'AUTH_REGISTERED',
          'AUTH_LOGGED_IN',
          'AUTH_REFRESHED',
          'AUTH_LOGGED_OUT',
          'AUTH_PASSWORD_CHANGED',
          'AUTH_PASSWORD_RESET_REQUESTED',
          'AUTH_PASSWORD_RESET_COMPLETED'
        ) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id CHAR(36) NULL,
        metadata JSON NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(512) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_audit_organization_created (organization_id, created_at),
        KEY IDX_audit_actor_created (actor_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE audit_logs');
    await queryRunner.query('DROP TABLE password_reset_tokens');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE organizations');
  }
}
