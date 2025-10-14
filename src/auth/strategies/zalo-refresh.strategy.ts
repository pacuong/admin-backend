// src/auth/strategies/zalo-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/common/interfaces/auth-request.interface';

@Injectable()
export class ZaloRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-zalo-refresh',
) {
  constructor(configService: ConfigService) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    super({
      // ✅ NHẬN refresh_token qua Authorization: Bearer <refresh_token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshSecret,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    console.log(
      '[ZALO REFRESH STRATEGY] Token hợp lệ cho user:',
      payload.email || payload.sub,
      '| thời điểm:',
      new Date().toISOString(),
    );

    return payload;
  }
}
