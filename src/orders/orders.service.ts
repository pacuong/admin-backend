import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Order, OrderDocument } from '../schemas/order.schema';
import { CartItem, CartItemDocument } from '../schemas/cart-item.schema';
import { CreateOrderDto } from './dto/create-order.dto';

import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.RECEIVED, OrderStatus.FAILED],
  [OrderStatus.RECEIVED]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.FAILED]: [],
  [OrderStatus.CANCELLED]: [],
};

interface AddressDocumentLean {
  _id: Types.ObjectId;
  full_name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

interface AddressSnapshot {
  full_name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

interface PopulatedProduct {
  _id: Types.ObjectId;
  name: string;
  img_url?: string;
  price: number;
  sale_price?: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(CartItem.name) private cartModel: Model<CartItemDocument>,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const uid = new Types.ObjectId(userId);

    // 1. Lấy thông tin sản phẩm trong giỏ
    const cartItems = await this.cartModel
      .find({ _id: { $in: dto.cart_item_ids }, user_id: uid })
      .populate('product_id', 'name img_url price sale_price')
      .exec();

    if (!cartItems.length) {
      throw new BadRequestException('Không có sản phẩm hợp lệ');
    }

    // 2. Lấy thông tin địa chỉ từ collection Address
    const addressData = await this.orderModel.db
      .collection<AddressDocumentLean>('addresses')
      .findOne({ _id: new Types.ObjectId(dto.address_id) });

    if (!addressData) {
      throw new BadRequestException('Không tìm thấy địa chỉ giao hàng');
    }

    // 3. Tạo danh sách sản phẩm trong order
    const order_items = cartItems.map((item) => {
      const product = item.product_id as unknown as PopulatedProduct;
      const unitPrice = product.sale_price ?? product.price;

      return {
        product_id: product._id,
        name: product.name,
        img_url: product.img_url ?? '',
        quantity: item.quantity,
        price: unitPrice,
      };
    });

    // 4. Tính tổng tiền
    const product_total = order_items.reduce(
      (sum, i) => sum + i.quantity * i.price,
      0,
    );

    if (dto.discount > product_total) {
      throw new BadRequestException('Giá trị giảm giá không hợp lệ');
    }

    const final_total = product_total - dto.discount + dto.shipping_fee;

    // 5. Snapshot địa chỉ
    const snapshot: AddressSnapshot = {
      full_name: addressData.full_name,
      phone: addressData.phone,
      street: addressData.street,
      ward: addressData.ward,
      district: addressData.district,
      province: addressData.province,
    };

    // 6. Tạo đơn hàng với snapshot địa chỉ
    const order = await this.orderModel.create({
      user_id: uid,
      address_id: dto.address_id,
      address_snapshot: snapshot,
      voucher_id: dto.voucher_id ?? null,
      total_price: final_total,
      payment_method: dto.payment_method,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.UNPAID,
      zalo_order_id: dto.zalo_order_id ?? null,
      app_trans_id: dto.app_trans_id ?? null,
      order_items,
      shipping_fee: dto.shipping_fee,
      discount: dto.discount,
    });

    // 7. Xoá các cart item đã đặt
    await this.cartModel.deleteMany({
      _id: { $in: dto.cart_item_ids },
      user_id: uid,
    });

    return order;
  }

  async getOrdersByUser(userId: string) {
    return this.orderModel
      .find({ user_id: new Types.ObjectId(userId) })
      .sort({ created_at: -1 })
      .exec();
  }

  async getOrderDetail(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(id),
        user_id: new Types.ObjectId(userId),
      })
      .populate({
        path: 'order_items.product_id',
        // 👇 chỉ lấy đúng các field FE cần cho trang product detail
        select:
          '_id name img_url price sale_price description category_id rating available create_at total_reviews',
        // 👇 populate lồng để có tên danh mục (FE đọc category?.name hoặc category_id?.name)
        populate: {
          path: 'category_id',
          select: '_id name',
        },
      })
      .lean() // 👈 trả về plain object
      .exec();

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async getAllOrders() {
    return this.orderModel
      .find()
      .sort({ created_at: -1 })
      .populate('user_id', 'name')
      .populate('address_id')
      .exec();
  }

  async receivedOrder(id: string, userId: string) {
    const order = await this.orderModel.findOne({
      _id: id,
      user_id: new Types.ObjectId(userId),
    });

    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');

    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException('Chỉ có thể xác nhận khi đang giao hàng');
    }

    order.status = OrderStatus.RECEIVED;
    return order.save();
  }

  async updateOrderStatus(
    id: string,
    nextStatus: OrderStatus,
    role: string,
    userId: string,
  ) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');

    const currentStatus = order.status;

    if (role === 'admin') {
      if (nextStatus === OrderStatus.RECEIVED) {
        throw new ForbiddenException('Admin không thể đặt trạng thái received');
      }

      const enumValues = Object.values(OrderStatus);
      if (!enumValues.includes(nextStatus)) {
        throw new BadRequestException('Trạng thái không hợp lệ');
      }

      const canGo = allowedTransitions[currentStatus] || [];
      if (!canGo.includes(nextStatus)) {
        throw new BadRequestException(
          `Không thể chuyển từ ${currentStatus} sang ${nextStatus}`,
        );
      }

      if (
        nextStatus === OrderStatus.COMPLETED &&
        currentStatus !== OrderStatus.RECEIVED
      ) {
        throw new BadRequestException(
          'Chỉ có thể hoàn tất khi đơn đã ở trạng thái received',
        );
      }

      if (nextStatus === OrderStatus.COMPLETED) {
        order.payment_status = PaymentStatus.PAID;
      }

      order.status = nextStatus;
      return order.save();
    }

    if (
      nextStatus === OrderStatus.CANCELLED &&
      order.user_id.toString() === userId &&
      [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(currentStatus)
    ) {
      order.status = OrderStatus.CANCELLED;
      return order.save();
    }

    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }

  async updatePaymentStatus(
    id: string,
    nextPayment: PaymentStatus,
    role: string,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Chỉ admin được phép cập nhật thanh toán');
    }

    if (![PaymentStatus.PAID, PaymentStatus.UNPAID].includes(nextPayment)) {
      throw new BadRequestException('Trạng thái thanh toán không hợp lệ');
    }

    const order = await this.orderModel.findById(id);
    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');

    if (
      nextPayment === PaymentStatus.PAID &&
      ![OrderStatus.RECEIVED, OrderStatus.COMPLETED].includes(order.status)
    ) {
      throw new BadRequestException(
        `Chỉ có thể thanh toán khi đơn ở trạng thái '${OrderStatus.RECEIVED}' hoặc '${OrderStatus.COMPLETED}'`,
      );
    }

    if (
      nextPayment === PaymentStatus.UNPAID &&
      order.status === OrderStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Đơn đã completed không thể chuyển lại unpaid',
      );
    }

    order.payment_status = nextPayment;

    return order.save();
  }
}
