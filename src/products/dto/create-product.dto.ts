import {
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  sale_price?: number;

  @IsNotEmpty()
  @IsMongoId()
  category_id: string;

  @IsOptional()
  @IsString()
  img_url?: string;

  @IsOptional()
  @IsString()
  img_public_id?: string;
}
