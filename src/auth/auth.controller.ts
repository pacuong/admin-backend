// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuthRequest,
  JwtPayload,
  RefreshRequest,
} from 'src/common/interfaces/auth-request.interface';
import { ZaloLoginDto } from './dto/zalo-login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { JwtZaloRefreshGuard } from './guards/jwt-zalo-refresh.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ===== WEB COOKIE FLOW =====
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(
    @Req() req: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayload;

    console.log(
      `[REFRESH] User ${user.email || user.sub} yêu cầu refresh lúc`,
      new Date().toISOString(),
    );
    const { access_token, refresh_token } =
      this.authService.generateTokens(user);

    // Chỉ áp dụng cho WEB: cookie httpOnly
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict', // web chuẩn; Zalo không dùng cookie
      path: '/',
    });

    return { access_token };
  }

  // auth.controller.ts
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } =
      await this.authService.login(dto);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    return { access_token, user };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthRequest) {
    const user = req.user;
    if (!user || !user.sub) throw new UnauthorizedException();
    return this.authService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // WEB: xoá cookie refresh
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Đăng xuất thành công' };
  }

  // ===== ZALO HEADER FLOW =====
  @Post('zalo-login')
  async zaloLogin(@Body() dto: ZaloLoginDto) {
    console.log('>>> incoming dto:', dto);
    // ✅ Trả về cả access_token & refresh_token để FE lưu refresh ở NativeStorage
    return this.authService.zaloLogin(dto);
  }

  @UseGuards(JwtZaloRefreshGuard)
  @Post('zalo-refresh')
  zaloRefresh(@Req() req: RefreshRequest) {
    // ✅ Guard 'jwt-zalo-refresh' đã xác thực refresh_token (Bearer)
    const user = req.user as JwtPayload;
    return this.authService.refreshTokenForZalo(user); // Trả access_token mới
  }
}
