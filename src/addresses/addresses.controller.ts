import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressesController {
  constructor(private readonly addressService: AddressesService) {}

  @Get()
  getMyAddresses(@Req() req: AuthRequest) {
    return this.addressService.getAddressesByUser(req.user!.sub);
  }

  @Get(':id')
  getById(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.addressService.getAddressById(req.user!.sub, id);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateAddressDto) {
    return this.addressService.createAddress(req.user!.sub, dto);
  }

  @Put(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.updateAddress(req.user!.sub, id, dto);
  }

  @Delete(':id')
  delete(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.addressService.deleteAddress(req.user!.sub, id);
  }

  @Get('default-or-recent')
  getDefaultOrRecent(@Req() req: AuthRequest) {
    return this.addressService.getDefaultOrRecent(req.user!.sub);
  }
}
