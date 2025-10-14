import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ZaloUserInfoDto {
  @IsString()
  zalo_id: string;

  @IsBoolean()
  consent_user_info: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
