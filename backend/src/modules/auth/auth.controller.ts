import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuthResponseDto, AuthenticatedUserDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ProfilePhotoStatusDto, UserProfileDto } from './dto/user-profile.dto';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

interface UploadedProfilePhoto {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@ApiTags('Authentication')
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.register(dto, this.requestContext(request));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Identifiants invalides.' })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, this.requestContext(request));
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiNoContentResponse({
    description: 'Une demande est toujours acceptée sans révéler si l’adresse existe.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request): Promise<void> {
    await this.authService.requestPasswordReset(dto, this.requestContext(request));
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiNoContentResponse({ description: 'Mot de passe réinitialisé et sessions longues invalidées.' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request): Promise<void> {
    await this.authService.resetPassword(dto, this.requestContext(request));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() _dto: RefreshTokenDto, @CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.authService.refresh(user, this.requestContext(request));
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiNoContentResponse({ description: 'Session longue invalidée.' })
  async logout(@CurrentUser() user: AuthenticatedUser, @Req() request: Request): Promise<void> {
    await this.authService.logout(user, this.requestContext(request));
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({ type: AuthenticatedUserDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOkResponse({ type: AuthenticatedUserDto })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.authService.updateProfile(user, dto, this.requestContext(request));
  }

  @ApiBearerAuth()
  @Get('me/profile')
  @ApiOkResponse({ type: UserProfileDto })
  getUserProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.authService.getUserProfile(user);
  }

  @ApiBearerAuth()
  @Patch('me/profile')
  @ApiOkResponse({ type: UserProfileDto })
  updateUserProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
    @Req() request: Request,
  ): Promise<UserProfileDto> {
    return this.authService.updateUserProfile(user, dto, this.requestContext(request));
  }

  @ApiBearerAuth()
  @Put('me/profile/photo')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
      required: ['photo'],
    },
  })
  @ApiOkResponse({ type: ProfilePhotoStatusDto })
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        const accepted = ['image/jpeg', 'image/png'].includes(file.mimetype);
        callback(
          accepted ? null : new BadRequestException('La photo doit être au format JPG ou PNG.'),
          accepted,
        );
      },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedProfilePhoto | undefined,
    @Req() request: Request,
  ): Promise<ProfilePhotoStatusDto> {
    return this.authService.saveProfilePhoto(user, file, this.requestContext(request));
  }

  @ApiBearerAuth()
  @Get('me/profile/photo')
  async getProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const photo = await this.authService.getProfilePhoto(user);
    response.set({
      'Content-Type': photo.mimeType,
      'Content-Length': String(photo.buffer.length),
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(photo.buffer);
  }

  @ApiBearerAuth()
  @Delete('me/profile/photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Photo de profil supprimée.' })
  async deleteProfilePhoto(@CurrentUser() user: AuthenticatedUser, @Req() request: Request): Promise<void> {
    await this.authService.deleteProfilePhoto(user, this.requestContext(request));
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  @ApiNoContentResponse({ description: 'Mot de passe modifié ; la session longue a été invalidée.' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.changePassword(user, dto, this.requestContext(request));
  }

  private requestContext(request: Request): RequestContext {
    const userAgent = request.headers['user-agent'];
    return {
      ip: request.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    };
  }
}
