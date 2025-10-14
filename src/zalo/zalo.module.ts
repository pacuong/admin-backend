import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ZaloController } from './zalo.controller';
import { ZaloService } from './zalo.service';

import { User, UserSchema } from 'src/schemas/user.schema';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { CartItem, CartItemSchema } from 'src/schemas/cart-item.schema';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import {
  ZaloTransaction,
  ZaloTransactionSchema,
} from 'src/schemas/zalo-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ZaloTransaction.name, schema: ZaloTransactionSchema },
    ]),
  ],
  controllers: [ZaloController],
  providers: [ZaloService],
  exports: [ZaloService],
})
export class ZaloModule {}
