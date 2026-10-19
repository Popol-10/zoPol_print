import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), AuditModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [TypeOrmModule],
})
export class OrganizationsModule {}
