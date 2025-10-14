import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  address_id: Types.ObjectId;

  @Prop({
    type: {
      full_name: String,
      phone: String,
      street: String,
      ward: String,
      district: String,
      province: String,
    },
    required: true,
  })
  address_snapshot: {
    full_name: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'Voucher', default: null })
  voucher_id?: Types.ObjectId;

  @Prop()
  total_price: number;

  @Prop({
    type: String,
    enum: PaymentMethod,
  })
  payment_method: PaymentMethod;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  payment_status: PaymentStatus;

  @Prop({ default: null })
  zalo_order_id?: string;

  @Prop({ default: null })
  app_trans_id?: string;

  @Prop({ default: false })
  is_reviewed: boolean;

  @Prop({ default: 0 })
  shipping_fee: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop([
    {
      product_id: { type: Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
      name: String,
      img_url: String,
    },
  ])
  order_items: {
    product_id: Types.ObjectId;
    quantity: number;
    price: number;
    name: string;
    img_url: string;
  }[];
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
