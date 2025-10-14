import { IsNotEmpty, IsString } from 'class-validator';

export class ZaloLoginDto {
  @IsNotEmpty()
  @IsString()
  access_token: string;

  @IsNotEmpty()
  @IsString()
  zalo_id: string;
}
