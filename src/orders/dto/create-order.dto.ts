import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class CreateOrderDto {
  @IsMongoId()
  address_id: string;

  @IsOptional()
  @IsMongoId()
  voucher_id?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  cart_item_ids: string[];

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  zalo_order_id?: string;

  @IsOptional()
  app_trans_id?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shipping_fee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount: number;
}
