import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ZaloService } from './zalo.service';
import { ZaloUserInfoDto } from './dto/user-info.dto';
import { CreateMacDto } from './dto/create-mac.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZaloTransaction,
  ZaloTransactionDocument,
} from '../schemas/zalo-transaction.schema';
import { ZaloNotifyPayload } from '../common/interfaces/zalo-notify.interface';
import { Request, Response } from 'express';
import { ZaloWebhookEvent } from 'src/common/interfaces/zalo-webhook.interface';

@Controller('zalo')
export class ZaloController {
  constructor(
    private readonly zaloService: ZaloService,
    @InjectModel(ZaloTransaction.name)
    private readonly zaloTransactionModel: Model<ZaloTransactionDocument>,
  ) {}

  // ===== User Info =====
  @Post('user-info')
  @HttpCode(200)
  async upsertUserInfo(@Body() dto: ZaloUserInfoDto) {
    return this.zaloService.upsertUserInfo(dto);
  }

  // ===== Thanh toán =====
  @Post('gen-mac')
  @HttpCode(200)
  genMac(@Body() dto: CreateMacDto) {
    const { amount, desc, item, extradata, method } = dto;
    const mac = this.zaloService.generateMac({
      amount,
      desc,
      item,
      extradata,
      method,
    });
    return { mac };
  }

  @Post('notify-cod')
  @HttpCode(200)
  async notifyCod(@Body() body: ZaloNotifyPayload): Promise<{ code: number }> {
    await this.zaloTransactionModel.create({
      app_trans_id: body.app_trans_id,
      zalo_order_id: body.orderId,
      amount: body.amount,
      status: body.status,
      timestamp: body.timestamp,
      mac: body.mac,
      message_token: body.messageToken,
      description: body.description,
      raw_payload: body,
    });

    return { code: 1 };
  }

  // ===== Webhook: user.revoke.consent =====
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['x-zevent-signature'] as string | undefined;
    const data = req.body as ZaloWebhookEvent;

    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    const isValid = this.zaloService.verifySignature(data, signature);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    if (data.event === 'user.revoke.consent') {
      await this.zaloService.deleteUserAndData(data.userId);
    }

    return res.json({ message: 'ok' });
  }
}
