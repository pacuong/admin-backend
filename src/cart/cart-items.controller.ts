// src/cart-items/cart-items.controller.ts
import {
  Controller,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from 'src/common/interfaces/auth-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartItemsController {
  constructor(private readonly cartService: CartItemsService) {}

  @Get()
  async getCart(@Request() req: AuthRequest) {
    console.log('>> current user:', req.user);
    return this.cartService.getCartByUser(req.user!.sub);
  }

  @Patch(':id')
  async updateQuantity(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(req.user!.sub, id, quantity);
  }

  @Delete(':id')
  async removeFromCart(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user!.sub, id);
  }
}
