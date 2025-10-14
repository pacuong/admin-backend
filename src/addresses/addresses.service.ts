import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schemas/address.schema';
import { Model, Types } from 'mongoose';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  async getAddressesByUser(userId: string) {
    return this.addressModel
      .find({ user_id: this.toObjectId(userId) })
      .sort({ created_at: -1 });
  }

  async getAddressById(userId: string, id: string) {
    const address = await this.addressModel.findOne({
      _id: id,
      user_id: this.toObjectId(userId),
    });

    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.is_default === true) {
      await this.addressModel.updateMany(
        { user_id: this.toObjectId(userId) },
        { is_default: false },
      );
    }

    return this.addressModel.create({
      user_id: this.toObjectId(userId),
      ...dto,
      is_default: dto.is_default ?? false,
    });
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    if (dto.is_default === true) {
      await this.addressModel.updateMany(
        { user_id: this.toObjectId(userId) },
        { is_default: false },
      );
    }

    const address = await this.addressModel.findOneAndUpdate(
      { _id: id, user_id: this.toObjectId(userId) },
      dto,
      { new: true },
    );
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
    return address;
  }

  async deleteAddress(userId: string, id: string) {
    const deleted = await this.addressModel.findOneAndDelete({
      _id: id,
      user_id: this.toObjectId(userId),
    });
    if (!deleted) throw new NotFoundException('Không tìm thấy địa chỉ');
    return { message: 'Đã xoá địa chỉ' };
  }

  async getDefaultOrRecent(userId: string) {
    const uid = this.toObjectId(userId);
    const defaultAddress = await this.addressModel.findOne({
      user_id: uid,
      is_default: true,
    });

    if (defaultAddress) return defaultAddress;

    const latestUsed = await this.addressModel
      .find({ user_id: uid })
      .sort({ created_at: -1 })
      .limit(1);

    if (!latestUsed.length)
      throw new NotFoundException('Người dùng chưa có địa chỉ');
    return latestUsed[0];
  }
}
