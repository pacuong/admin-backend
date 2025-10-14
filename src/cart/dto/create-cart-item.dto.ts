import { IsMongoId, IsOptional, Min, IsNumber } from 'class-validator';

export class CreateCartItemDto {
  @IsMongoId()
  product_id: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
