// src/auth/strategies/refresh-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  JwtPayload,
  RefreshRequest,
} from 'src/common/interfaces/auth-request.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    // ❗️Chỉ dùng cho WEB: đọc refresh_token từ cookie httpOnly
    const cookieExtractor: JwtFromRequestFunction = (req: RefreshRequest) => {
      const token = req?.cookies?.refresh_token;
      console.log(
        '[REFRESH STRATEGY] Gọi refresh token lúc:',
        new Date().toISOString(),
        '| Có cookie:',
        Boolean(token),
      );
      return token ?? null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: refreshSecret,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    console.log(
      '[REFRESH STRATEGY] Token hợp lệ cho user:',
      payload.email || payload.sub,
      '| thời điểm:',
      new Date().toISOString(),
    );
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
