import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { EnvironmentVariables } from '../../config/environment.validation';
import { Organization } from '../organizations/entities/organization.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { UserStatus } from '../users/entities/user-status.enum';
import { UsersService } from '../users/users.service';
import { AuthLifecycleHooks } from './auth-lifecycle.hooks';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ProfilePhotoStatusDto, UserProfileDto } from './dto/user-profile.dto';
import { durationToMilliseconds, normalizeEmail, slugify } from './utils/auth.utils';

type JwtDuration = `${number}${'s' | 'm' | 'h' | 'd'}`;

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: Date;
}

interface ProfilePhotoUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(UserProfile)
    private readonly profilesRepository: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly usersService: UsersService,
    private readonly hooks: AuthLifecycleHooks,
  ) {}

  async register(dto: RegisterDto, context?: RequestContext): Promise<AuthResponse> {
    const email = normalizeEmail(dto.email);
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new ConflictException('Un compte utilise déjà cette adresse e-mail.');

    try {
      const response = await this.dataSource.transaction(async (manager) => {
        const organizations = manager.getRepository(Organization);
        const users = manager.getRepository(User);
        const organization = organizations.create({
          name: dto.organizationName,
          slug: await this.nextOrganizationSlug(dto.organizationName, organizations),
        });
        await organizations.save(organization);

        const user = users.create({
          organizationId: organization.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          passwordHash: await this.hash(dto.password),
          roles: [UserRole.ADMIN],
          status: UserStatus.ACTIVE,
          passwordChangedAt: new Date(),
        });
        await users.save(user);

        const tokens = await this.createTokens(user);
        user.refreshTokenHash = await this.hash(tokens.refreshToken);
        user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
        await users.save(user);

        return this.toAuthResponse(user, tokens);
      });

      const registeredUser = await this.usersService.findByEmail(email);
      if (registeredUser) await this.hooks.onRegistered(registeredUser, context);
      return response;
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException("L'organisation ou l'adresse e-mail existe déjà.");
      }
      throw error;
    }
  }

  async login(dto: LoginDto, context?: RequestContext): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(normalizeEmail(dto.email), true);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    }
    this.ensureActive(user);

    const tokens = await this.createTokens(user);
    user.refreshTokenHash = await this.hash(tokens.refreshToken);
    user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    user.lastLoginAt = new Date();
    await this.usersService.save(user);
    await this.hooks.onLoggedIn(user, context);

    return this.toAuthResponse(user, tokens);
  }

  async refresh(authenticatedUser: AuthenticatedUser, context?: RequestContext): Promise<AuthResponse> {
    const user = await this.requireUser(authenticatedUser.id, true);
    this.ensureActive(user);

    const tokens = await this.createTokens(user);
    user.refreshTokenHash = await this.hash(tokens.refreshToken);
    user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    await this.usersService.save(user);
    await this.hooks.onRefreshed(user, context);

    return this.toAuthResponse(user, tokens);
  }

  async logout(authenticatedUser: AuthenticatedUser, context?: RequestContext): Promise<void> {
    const user = await this.requireUser(authenticatedUser.id);
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.usersService.save(user);
    await this.hooks.onLoggedOut(user, context);
  }

  async requestPasswordReset(dto: ForgotPasswordDto, context?: RequestContext): Promise<void> {
    const user = await this.usersService.findByEmail(normalizeEmail(dto.email));
    if (!user || user.status !== UserStatus.ACTIVE) return;

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.config.get('PASSWORD_RESET_TTL_MINUTES', { infer: true }) * 60_000,
    );

    await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      await tokens
        .createQueryBuilder()
        .delete()
        .from(PasswordResetToken)
        .where('user_id = :userId AND used_at IS NULL', { userId: user.id })
        .execute();
      await tokens.save(
        tokens.create({
          userId: user.id,
          tokenHash: this.hashResetToken(rawToken),
          expiresAt,
          usedAt: null,
        }),
      );
    });

    await this.hooks.onPasswordResetRequested(user, rawToken, context);
  }

  async resetPassword(dto: ResetPasswordDto, context?: RequestContext): Promise<void> {
    const user = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      const token = await tokens
        .createQueryBuilder('resetToken')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('resetToken.user', 'user')
        .where('resetToken.token_hash = :tokenHash', {
          tokenHash: this.hashResetToken(dto.token),
        })
        .andWhere('resetToken.used_at IS NULL')
        .andWhere('resetToken.expires_at > :now', { now: new Date() })
        .getOne();

      if (!token || token.user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Le lien de réinitialisation est invalide ou expiré.');
      }

      token.usedAt = new Date();
      token.user.passwordHash = await this.hash(dto.newPassword);
      token.user.passwordChangedAt = new Date();
      token.user.refreshTokenHash = null;
      token.user.refreshTokenExpiresAt = null;
      await manager.getRepository(User).save(token.user);
      await tokens.save(token);
      return token.user;
    });

    await this.hooks.onPasswordResetCompleted(user, context);
  }

  async getProfile(authenticatedUser: AuthenticatedUser): Promise<AuthResponse['user']> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    return this.toAuthenticatedUser(user);
  }

  async updateProfile(
    authenticatedUser: AuthenticatedUser,
    dto: UpdateProfileDto,
    context?: RequestContext,
  ): Promise<AuthResponse['user']> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    if (user.firstName === firstName && user.lastName === lastName) {
      return this.toAuthenticatedUser(user);
    }
    user.firstName = firstName;
    user.lastName = lastName;
    await this.usersService.save(user);
    await this.hooks.onProfileUpdated(user, context);
    return this.toAuthenticatedUser(user);
  }

  async getUserProfile(authenticatedUser: AuthenticatedUser): Promise<UserProfileDto> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    return this.toUserProfile(user);
  }

  async updateUserProfile(
    authenticatedUser: AuthenticatedUser,
    dto: UpdateUserProfileDto,
    context?: RequestContext,
  ): Promise<UserProfileDto> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    const organization = dto.birthDate
      ? await this.organizationsRepository.findOneBy({ id: user.organizationId })
      : null;
    if (
      dto.birthDate &&
      dto.birthDate > this.currentDateInTimeZone(organization?.timezone ?? 'Indian/Antananarivo')
    ) {
      throw new BadRequestException('La date de naissance ne peut pas être dans le futur.');
    }
    const profileFields = ['phone', 'address', 'birthDate', 'about'] as const;
    let profile = await this.profilesRepository.findOneBy({ userId: user.id });
    let profileChanged = false;

    for (const field of profileFields) {
      const value = dto[field];
      if (value !== undefined && profile?.[field] !== value) {
        if (!profile) profile = this.profilesRepository.create({ userId: user.id });
        profile[field] = value;
        profileChanged = true;
      }
    }

    const identityChanged = user.firstName !== dto.firstName || user.lastName !== dto.lastName;
    if (identityChanged) {
      user.firstName = dto.firstName;
      user.lastName = dto.lastName;
      await this.usersService.save(user);
    }
    if (profileChanged && profile) await this.profilesRepository.save(profile);
    if (identityChanged || profileChanged) await this.hooks.onProfileUpdated(user, context);

    return this.toUserProfile(user);
  }

  async saveProfilePhoto(
    authenticatedUser: AuthenticatedUser,
    file: ProfilePhotoUpload | undefined,
    context?: RequestContext,
  ): Promise<ProfilePhotoStatusDto> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Sélectionnez une photo JPG ou PNG.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('La photo ne peut pas dépasser 2 Mo.');
    }

    const mimeType = this.detectProfilePhotoMimeType(file.buffer);
    if (!mimeType || mimeType !== file.mimetype) {
      throw new BadRequestException('Le contenu du fichier doit être une image JPG ou PNG valide.');
    }

    const profile =
      (await this.profilesRepository.findOneBy({ userId: user.id })) ??
      this.profilesRepository.create({ userId: user.id });
    profile.profilePhoto = file.buffer;
    profile.profilePhotoMimeType = mimeType;
    await this.profilesRepository.save(profile);
    await this.hooks.onProfileUpdated(user, context);
    return { hasProfilePhoto: true };
  }

  async getProfilePhoto(authenticatedUser: AuthenticatedUser): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .addSelect('profile.profilePhoto')
      .addSelect('profile.profilePhotoMimeType')
      .where('profile.userId = :userId', { userId: user.id })
      .getOne();
    if (!profile?.profilePhoto || !profile.profilePhotoMimeType) {
      throw new NotFoundException('Aucune photo de profil n’est enregistrée.');
    }
    return { buffer: profile.profilePhoto, mimeType: profile.profilePhotoMimeType };
  }

  async deleteProfilePhoto(authenticatedUser: AuthenticatedUser, context?: RequestContext): Promise<void> {
    const user = await this.requireUser(authenticatedUser.id);
    this.ensureActive(user);
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .addSelect('profile.profilePhoto')
      .addSelect('profile.profilePhotoMimeType')
      .where('profile.userId = :userId', { userId: user.id })
      .getOne();
    if (!profile?.profilePhoto) return;
    profile.profilePhoto = null;
    profile.profilePhotoMimeType = null;
    await this.profilesRepository.save(profile);
    await this.hooks.onProfileUpdated(user, context);
  }

  async changePassword(
    authenticatedUser: AuthenticatedUser,
    dto: ChangePasswordDto,
    context?: RequestContext,
  ): Promise<void> {
    const user = await this.requireUser(authenticatedUser.id, true);
    this.ensureActive(user);
    if (!(await argon2.verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    }
    if (await argon2.verify(user.passwordHash, dto.newPassword)) {
      throw new ConflictException('Le nouveau mot de passe doit être différent de l’ancien.');
    }

    user.passwordHash = await this.hash(dto.newPassword);
    user.passwordChangedAt = new Date();
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.usersService.save(user);
    await this.hooks.onPasswordChanged(user, context);
  }

  async validateAccessToken(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.requireUser(payload.sub);
    this.ensureActive(user);
    return this.toAuthenticatedUser(user);
  }

  async validateRefreshToken(payload: JwtPayload, refreshToken: string): Promise<AuthenticatedUser> {
    const user = await this.requireUser(payload.sub, true);
    this.ensureActive(user);
    const isValid =
      Boolean(user.refreshTokenHash) &&
      Boolean(user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() > Date.now()) &&
      (await argon2.verify(user.refreshTokenHash as string, refreshToken));

    if (!isValid) throw new UnauthorizedException('Le jeton de renouvellement est invalide ou expiré.');
    return this.toAuthenticatedUser(user);
  }

  private async createTokens(user: User): Promise<IssuedTokens> {
    const accessTtl = this.config.get('JWT_ACCESS_TTL', { infer: true }) as JwtDuration;
    const refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true }) as JwtDuration;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      tokenType: 'access',
    };
    const refreshPayload: JwtPayload = { ...payload, tokenType: 'refresh' };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: refreshTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: durationToMilliseconds(accessTtl) / 1000,
      refreshTokenExpiresAt: new Date(Date.now() + durationToMilliseconds(refreshTtl)),
    };
  }

  private async nextOrganizationSlug(name: string, organizations: Repository<Organization>): Promise<string> {
    const base = slugify(name).slice(0, 120);
    let candidate = base;
    let suffix = 2;

    while (await organizations.exists({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`.slice(0, 140);
      suffix += 1;
    }

    return candidate;
  }

  private async requireUser(id: string, includeCredentials = false): Promise<User> {
    const user = await this.usersService.findById(id, includeCredentials);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');
    return user;
  }

  private ensureActive(user: User): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Ce compte est désactivé.');
    }
  }

  private toAuthResponse(user: User, tokens: IssuedTokens): AuthResponse {
    return {
      user: this.toAuthenticatedUser(user),
      tokens: {
        tokenType: 'Bearer',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      },
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      roles: user.roles,
    };
  }

  private async toUserProfile(user: User): Promise<UserProfileDto> {
    const [organization, profile] = await Promise.all([
      this.organizationsRepository.findOneBy({ id: user.organizationId }),
      this.profilesRepository
        .createQueryBuilder('profile')
        .addSelect('profile.profilePhotoMimeType')
        .where('profile.userId = :userId', { userId: user.id })
        .getOne(),
    ]);
    return {
      ...this.toAuthenticatedUser(user),
      organizationName: organization?.name ?? '',
      phone: profile?.phone ?? null,
      address: profile?.address ?? null,
      birthDate: profile?.birthDate ?? null,
      about: profile?.about ?? null,
      hasProfilePhoto: Boolean(profile?.profilePhotoMimeType),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private detectProfilePhotoMimeType(buffer: Buffer): string | null {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buffer.length >= pngSignature.length && buffer.subarray(0, 8).equals(pngSignature)) {
      return 'image/png';
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    return null;
  }

  private currentDateInTimeZone(timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  private hash(value: string): Promise<string> {
    return argon2.hash(value, { type: argon2.argon2id });
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
