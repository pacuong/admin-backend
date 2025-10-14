// src/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product, ProductDocument } from 'src/schemas/product.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateCategoryDto) {
    if ('is_active' in dto && dto['is_active'] === false) {
      throw new Error('Không thể tạo danh mục không hoạt động');
    }
    const existed = await this.categoryModel.findOne({ name: dto.name });
    if (existed) {
      throw new Error('Tên danh mục đã tồn tại');
    }
    const result = await this.categoryModel.create({ ...dto, is_active: true });
    return result;
  }

  async findAll(isAdmin = false) {
    return this.categoryModel.find(isAdmin ? {} : { is_active: true }).exec();
  }

  async findOne(id: string, isAdmin = false) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category || (!isAdmin && !category.is_active)) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (dto.name) {
      const existed = await this.categoryModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });

      if (existed) {
        throw new Error('Tên danh mục đã tồn tại');
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Không tìm thấy danh mục');

    await this.productModel
      .updateMany({ category_id: id }, { $unset: { category_id: '' } })
      .exec();

    return {
      message: 'Đã xoá danh mục và gỡ danh mục khỏi các sản phẩm liên quan',
    };
  }
}
