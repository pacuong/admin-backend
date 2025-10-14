import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty() @IsString() full_name: string;
  @IsNotEmpty() @IsString() phone: string;
  @IsNotEmpty() @IsString() street: string;
  @IsNotEmpty() @IsString() ward: string;
  @IsNotEmpty() @IsString() district: string;
  @IsNotEmpty() @IsString() province: string;
  @IsOptional() @IsBoolean() is_default?: boolean;
}
