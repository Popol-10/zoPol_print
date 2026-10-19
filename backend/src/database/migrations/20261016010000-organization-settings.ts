import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationSettings20261016010000 implements MigrationInterface {
  name = 'OrganizationSettings20261016010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE organizations ADD COLUMN address VARCHAR(255) NULL AFTER name');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE organizations DROP COLUMN address');
  }
}
