// src/auth/guards/jwt-zalo-refresh.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// ✅ Guard cho Zalo refresh: dùng strategy 'jwt-zalo-refresh'
@Injectable()
export class JwtZaloRefreshGuard extends AuthGuard('jwt-zalo-refresh') {}
