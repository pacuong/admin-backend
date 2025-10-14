// src/auth/auth.service.ts
import {
  BadRequestException,
  Body,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { ZaloLoginDto } from './dto/zalo-login.dto';
import { JwtPayload } from 'src/common/interfaces/auth-request.interface';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  private formatUser(userDoc: UserDocument) {
    return {
      _id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      avatar: userDoc.avatar ?? null,
      phone: userDoc.phone ?? null,
    };
  }

  // ========== WEB (COOKIE-BASED) ==========
  // Không đụng đến flow này cho Zalo Mini App. Để nguyên để web dùng cookie.
  // auth.service.ts
  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user || !user.password)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const userDoc = user as UserDocument;
    const payload: JwtPayload = {
      sub: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
    };

    const { access_token, refresh_token } = this.generateTokens(payload);

    return {
      access_token,
      refresh_token, // 👈 trả ra để controller tự set cookie
      user: this.formatUser(userDoc),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng');
    return user;
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new UnauthorizedException('Email đã tồn tại');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = (await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hash,
    })) as UserDocument;

    return {
      message: 'Đăng ký thành công',
      user: this.formatUser(user),
    };
  }

  // ========== ZALO (HEADER-BASED, KHÔNG COOKIE) ==========
  // ✅ SỬA: Phát hành CẢ access_token & refresh_token để FE lưu refresh vào NativeStorage.
  async zaloLogin(dto: ZaloLoginDto) {
    let user = await this.userModel.findOne({ zalo_id: dto.zalo_id });

    if (!user) {
      try {
        user = await this.userModel.create({
          zalo_id: dto.zalo_id,
          source: 'zalo',
          role: 'user',
        });
      } catch (err) {
        console.error('❌ Failed to create user from Zalo:', err);
        throw new BadRequestException('Tạo user từ Zalo thất bại');
      }
    }

    const userDoc = user as UserDocument;

    const payload: JwtPayload = {
      sub: userDoc._id.toString(),
      role: userDoc.role,
      // (Zalo có thể không có name/email — không bắt buộc)
      name: userDoc.name,
      email: userDoc.email,
    };

    // ✅ dùng generateTokens để đồng bộ TTL/secret 2 loại token
    const { access_token, refresh_token } = this.generateTokens(payload);

    // ❗️KHÔNG set cookie ở đây — để FE tự lưu refresh_token vào Zalo NativeStorage
    return {
      access_token,
      refresh_token, // <— FE Zalo cần cái này để gọi /auth/zalo-refresh
      user: this.formatUser(userDoc),
    };
  }

  // ========== COMMON ==========
  generateTokens(payload: JwtPayload): {
    access_token: string;
    refresh_token: string;
  } {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
      throw new Error('Missing JWT secrets');
    }

    const access_token = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: process.env.JWT_SECRET_EXPIRES, // ví dụ: '2m'
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: process.env.JWT_REFRESH_EXPIRES, // ví dụ: '7d'
    });

    return { access_token, refresh_token };
  }

  // WEB cookie flow: trả access mới (cookie refresh ở guard đã OK)
  refreshToken(user: JwtPayload) {
    const payload: JwtPayload = {
      sub: user.sub,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_SECRET_EXPIRES,
      }),
    };
  }

  // ZALO header flow: dùng refresh_token (Bearer, jwt-zalo-refresh) để cấp access mới
  refreshTokenForZalo(user: JwtPayload) {
    const payload: JwtPayload = {
      sub: user.sub,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET, // ký bằng access secret
        expiresIn: process.env.JWT_SECRET_EXPIRES,
      }),
    };
  }
}
