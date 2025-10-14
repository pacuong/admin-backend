// src/products/products.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CartItem, CartItemDocument } from '../schemas/cart-item.schema';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

interface SafeMulterFile extends Express.Multer.File {
  buffer: Buffer;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(CartItem.name) private cartModel: Model<CartItemDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const category = await this.categoryModel.findById(dto.category_id);
    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại');
    }

    let img_url = dto.img_url ?? '';
    let img_public_id = dto.img_public_id ?? '';

    if (!img_url && file && (file as SafeMulterFile).buffer instanceof Buffer) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'products',
      );
      img_url = uploaded.url;
      img_public_id = uploaded.public_id;
    }

    const result = await this.productModel.create({
      ...dto,
      img_url,
      img_public_id,
      available: true,
    });

    return result;
  }

  async findAll(isAdmin = false) {
    const products = await this.productModel
      .find(isAdmin ? {} : { available: true })
      .populate('category_id')
      .exec();

    if (!isAdmin) {
      return products.filter((p) => {
        const category = p.category_id as unknown as Category;
        return category?.is_active !== false;
      });
    }

    return products;
  }

  async findOne(id: string, isAdmin = false) {
    const product = await this.productModel
      .findById(id)
      .populate<{ category_id: Category }>('category_id', 'name is_active')
      .exec();

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (!isAdmin) {
      const category = product.category_id;
      if (!product.available || category?.is_active === false) {
        throw new NotFoundException('Sản phẩm không khả dụng');
      }
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    // Nếu có ảnh mới
    if (file && (file as SafeMulterFile).buffer instanceof Buffer) {
      if (product.img_public_id) {
        await this.cloudinaryService.deleteImage(product.img_public_id);
      }

      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'products',
      );
      dto.image = uploaded.url;
      product.img_public_id = uploaded.public_id;
    }

    // Cập nhật các field còn lại
    Object.assign(product, {
      ...dto,
    });

    return product.save();
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    if (product.img_public_id) {
      await this.cloudinaryService.deleteImage(product.img_public_id);
    }

    await this.productModel.findByIdAndDelete(id);
    return { message: 'Đã xoá sản phẩm và ảnh thành công' };
  }

  async addToCart(userId: string, productId: string) {
    const product = await this.productModel
      .findById(productId)
      .populate<{ category_id: Category }>('category_id')
      .exec();

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (product.available === false) {
      throw new BadRequestException('Sản phẩm không hoạt động');
    }

    const category = product.category_id;
    if (category?.is_active === false) {
      throw new BadRequestException('Danh mục không hoạt động');
    }

    const existing = await this.cartModel.findOne({
      user_id: new Types.ObjectId(userId),
      product_id: productId,
    });

    if (existing) {
      existing.quantity += 1;
      return existing.save();
    }

    const created = new this.cartModel({
      user_id: new Types.ObjectId(userId),
      product_id: productId,
      quantity: 1,
    });

    return created.save();
  }
}
