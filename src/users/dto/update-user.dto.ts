import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() zalo_id?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
}
