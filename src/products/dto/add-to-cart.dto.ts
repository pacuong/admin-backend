import { IsMongoId } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  product_id: string;
}
