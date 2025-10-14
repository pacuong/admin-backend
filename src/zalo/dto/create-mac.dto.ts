// src/zalo/dto/create-mac.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentItemDto } from './payment-item.dto';

export class CreateMacDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  desc: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  item: PaymentItemDto[];

  @IsNotEmpty()
  @IsObject()
  extradata: Record<string, string | number | boolean>;

  @IsNotEmpty()
  @IsObject()
  method: {
    id: string;
    isCustom: boolean;
  };
}
