// src/cart-items/cart-items.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartItem, CartItemDocument } from '../schemas/cart-item.schema';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectModel(CartItem.name)
    private readonly cartModel: Model<CartItemDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getCartByUser(userId: string) {
    return this.cartModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate('product_id')
      .exec();
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const item = await this.cartModel.findById(cartItemId);
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');

    if (!item.user_id.equals(new Types.ObjectId(userId))) {
      throw new UnauthorizedException('Không có quyền');
    }

    item.quantity = quantity;
    return item.save();
  }

  async removeFromCart(userId: string, cartItemId: string) {
    const item = await this.cartModel.findById(cartItemId);
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');

    if (!item.user_id.equals(new Types.ObjectId(userId))) {
      throw new UnauthorizedException('Không có quyền');
    }

    await this.cartModel.findByIdAndDelete(cartItemId);
    return { message: 'Đã xoá khỏi giỏ hàng' };
  }
}
