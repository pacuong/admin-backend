// src/cloudinary/cloudinary.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Delete,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file, 'products');
    return result;
  }

  @Delete('image')
  async deleteImage(@Body('public_id') public_id: string) {
    return this.cloudinaryService.deleteImage(public_id);
  }

  @Get('images')
  async listImages(@Query('folder') folder: string) {
    return this.cloudinaryService.listImages(folder);
  }
}
