import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Put,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create')
  create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user!.sub, dto);
  }

  @Get()
  getAllOrders(@Req() req: AuthRequest) {
    if (req.user?.role !== 'admin')
      throw new ForbiddenException('Chỉ admin mới được truy cập');
    return this.ordersService.getAllOrders();
  }

  @Get('me')
  getMyOrders(@Req() req: AuthRequest) {
    return this.ordersService.getOrdersByUser(req.user!.sub);
  }

  @Get(':id')
  getOrder(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.getOrderDetail(id, req.user!.sub);
  }

  @Put('received/:id')
  markReceived(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.receivedOrder(id, req.user!.sub);
  }

  @Put('status/:id')
  updateOrderStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status,
      req.user!.role,
      req.user!.sub,
    );
  }

  @Put('payment-status/:id')
  updatePaymentStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { payment_status: PaymentStatus },
  ) {
    return this.ordersService.updatePaymentStatus(
      id,
      body.payment_status,
      req.user!.role,
    );
  }
}
