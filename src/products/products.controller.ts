import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from 'src/common/interfaces/auth-request.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Request() req: AuthRequest) {
    const isAdmin = req.user?.role === 'admin';
    return this.productsService.findAll(isAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    const isAdmin = req.user?.role === 'admin';
    return this.productsService.findOne(id, isAdmin);
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Request() req: AuthRequest,
    @Body() dto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.productsService.create(dto, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.productsService.update(id, dto, file);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.productsService.deleteProduct(id);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async addToCart(@Request() req: AuthRequest, @Body() dto: AddToCartDto) {
    return this.productsService.addToCart(req.user!.sub, dto.product_id);
  }
}
