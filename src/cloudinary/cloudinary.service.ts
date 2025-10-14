import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  public_id: string;
}

interface CloudinaryResource {
  secure_url: string;
  public_id: string;
}

interface CloudinarySearchResponse {
  resources: CloudinaryResource[];
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  onModuleInit() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('[Cloudinary Config]', {
      name: process.env.CLOUDINARY_CLOUD_NAME,
      key: process.env.CLOUDINARY_API_KEY,
      secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    if (!file?.buffer) {
      throw new BadRequestException('Không nhận được file hợp lệ');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result: UploadApiResponse) => {
          if (error) {
            return reject(
              new BadRequestException(error.message || 'Upload thất bại'),
            );
          }

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    const result = (await cloudinary.uploader.destroy(publicId)) as {
      result: string;
    };
    return result;
  }

  async listImages(folder: string): Promise<UploadResult[]> {
    const result = (await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute()) as CloudinarySearchResponse;

    return result.resources.map((r) => ({
      url: r.secure_url,
      public_id: r.public_id,
    }));
  }
}
