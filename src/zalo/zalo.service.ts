import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ZaloUserInfoDto } from './dto/user-info.dto';
import { Address, AddressDocument } from 'src/schemas/address.schema';
import { CartItem, CartItemDocument } from 'src/schemas/cart-item.schema';
import { Order, OrderDocument } from 'src/schemas/order.schema';
import {
  ZaloTransaction,
  ZaloTransactionDocument,
} from 'src/schemas/zalo-transaction.schema';
import { ZaloWebhookEvent } from 'src/common/interfaces/zalo-webhook.interface';

type UpsertUserInfoResult = {
  ok: true;
  user: {
    id: string;
    zalo_id: string;
    name?: string;
    avatar?: string;
    consent_user_info: boolean;
  };
};

@Injectable()
export class ZaloService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(CartItem.name) private cartModel: Model<CartItemDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(ZaloTransaction.name)
    private zaloTransactionModel: Model<ZaloTransactionDocument>,
  ) {}

  // ⚠️ Dùng App Secret để verify webhook
  private readonly appSecret = process.env.ZALO_APP_SECRET || 'demo_secret';

  // ⚠️ Dùng API Key khi sinh MAC cho thanh toán
  private readonly apiKey = process.env.ZALO_API_KEY || 'demo_secret';

  private async ensureUser(zalo_id: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ zalo_id }).exec();
    if (!user) {
      try {
        user = await this.userModel.create({ zalo_id });
      } catch {
        throw new InternalServerErrorException('Không thể tạo user mới');
      }
    }
    return user;
  }

  async upsertUserInfo(dto: ZaloUserInfoDto): Promise<UpsertUserInfoResult> {
    if (!dto.zalo_id) {
      throw new BadRequestException('Thiếu zalo_id');
    }

    const user = await this.ensureUser(dto.zalo_id);

    user.consent_user_info = !!dto.consent_user_info;

    if (dto.consent_user_info) {
      if (dto.name) user.name = dto.name;
      if (dto.avatar) user.avatar = dto.avatar;
    }

    try {
      await user.save();
    } catch {
      throw new InternalServerErrorException('Không thể lưu thông tin user');
    }

    return {
      ok: true,
      user: {
        id: String(user._id),
        zalo_id: user.zalo_id!,
        name: user.name,
        avatar: user.avatar,
        consent_user_info: user.consent_user_info,
      },
    };
  }

  // Utility: stringify an toàn cho mọi loại dữ liệu
  private safeStringify(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') return JSON.stringify(val);
    return ''; // fallback
  }

  // ===== Sinh MAC cho thanh toán =====
  generateMac(params: Record<string, unknown>): string {
    const dataMac = Object.keys(params)
      .sort()
      .map((key) => `${key}=${this.safeStringify(params[key])}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.apiKey)
      .update(dataMac)
      .digest('hex');
  }

  // ===== Verify Signature từ Zalo webhook =====
  verifySignature(data: ZaloWebhookEvent, signature: string): boolean {
    const record: Record<string, string | number> = {
      event: data.event,
      appId: data.appId,
      userId: data.userId,
      timestamp: data.timestamp,
    };

    const content = Object.keys(record)
      .sort()
      .map((k) => this.safeStringify(record[k]))
      .join('');

    const hash = crypto
      .createHmac('sha256', this.appSecret)
      .update(content)
      .digest('hex');

    console.log('Webhook received:', data);
    console.log('Built content:', content);
    console.log('Expected hash:', hash);
    console.log('Incoming signature:', signature);

    return hash === signature;
  }

  // ===== Xoá toàn bộ dữ liệu user khi revoke consent =====
  async deleteUserAndData(zaloUserId: string) {
    const user = await this.userModel.findOne({ zalo_id: zaloUserId });
    if (!user) return;

    const userId = user._id;

    await Promise.all([
      this.addressModel.deleteMany({ user_id: userId }),
      this.cartModel.deleteMany({ user_id: userId }),
    ]);

    await this.userModel.deleteOne({ _id: userId });
  }
}
