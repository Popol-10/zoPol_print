import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { User } from './entities/user.entity';
import { UserMemberCreationController } from './user-member-creation.controller';
import { UserMemberCreationService } from './user-member-creation.service';
import { UserRoleManagementService } from './user-role-management.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule],
  controllers: [UsersController, UserMemberCreationController],
  providers: [UsersService, UserRoleManagementService, UserMemberCreationService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
