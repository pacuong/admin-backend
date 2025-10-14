// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.name) user.name = dto.name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.zalo_id) user.zalo_id = dto.zalo_id;

    const saved = await user.save();

    // Lấy ra toàn bộ field (kể cả password), nhưng chỉ dùng `result`
    const { password, ...result } = saved.toObject();
    void password;
    return result;
  }

  async deleteUser(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Không tìm thấy người dùng');
    return { message: 'Đã xoá người dùng' };
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) throw new Error('Email đã tồn tại');

    const hash = await bcrypt.hash(dto.password, 10);
    const created = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hash,
      role: dto.role || 'admin',
    });

    return {
      message: 'Tạo người dùng thành công',
      user: {
        _id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
      },
    };
  }
}
