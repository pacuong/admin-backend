// src/zalo/dto/payment-item.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class PaymentItemDto {
  @IsString()
  id: string;

  @IsNumber()
  amount: number;
}
