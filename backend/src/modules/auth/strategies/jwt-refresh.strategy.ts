import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvironmentVariables } from '../../../config/environment.validation';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: config.get('JWT_REFRESH_SECRET', { infer: true }),
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.tokenType !== 'refresh') throw new UnauthorizedException();
    const refreshToken = request.body?.refreshToken;
    if (typeof refreshToken !== 'string') throw new UnauthorizedException();
    return this.authService.validateRefreshToken(payload, refreshToken);
  }
}
