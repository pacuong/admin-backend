import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ZaloNotifyPayload } from 'src/common/interfaces/zalo-notify.interface';

export type ZaloTransactionDocument = ZaloTransaction & Document;

@Schema()
export class ZaloTransaction {
  @Prop({ required: true, index: true })
  app_trans_id: string;

  @Prop()
  zalo_order_id?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: number;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  mac: string;

  @Prop()
  message_token?: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  internal_order_id?: Types.ObjectId;

  @Prop({ type: Object })
  raw_payload?: ZaloNotifyPayload;

  @Prop({ default: Date.now, index: true })
  created_at: Date;
}

export const ZaloTransactionSchema =
  SchemaFactory.createForClass(ZaloTransaction);
