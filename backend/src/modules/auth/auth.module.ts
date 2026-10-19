import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { Organization } from '../organizations/entities/organization.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthLifecycleHooks } from './auth-lifecycle.hooks';
import { PasswordResetDeliveryHook } from './password-reset-delivery.hook';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Organization, PasswordResetToken, UserProfile]),
    UsersModule,
    AuditModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthLifecycleHooks,
    PasswordResetDeliveryHook,
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshTokenGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
