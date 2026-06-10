import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryConfig } from '../config';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService<Record<string, unknown>>) {}

  onModuleInit() {
    const cloudinaryConf =
      this.configService.get<CloudinaryConfig>('cloudinary');

    cloudinary.config({
      cloud_name: cloudinaryConf?.cloudName,
      api_key: cloudinaryConf?.apiKey,
      api_secret: cloudinaryConf?.apiSecret,
    });

    this.logger.log('Cloudinary configured');
  }

  async uploadFromBuffer(
    buffer: Buffer,
    options?: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ?? 'scouttalk',
          public_id: options?.publicId,
          resource_type: options?.resourceType ?? 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadImage(
    filePath: string,
    options?: { folder?: string; publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options?.folder ?? 'scouttalk',
      public_id: options?.publicId,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  async uploadVideo(
    filePath: string,
    options?: { folder?: string; publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options?.folder ?? 'scouttalk',
      public_id: options?.publicId,
      resource_type: 'video',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  async uploadRaw(
    filePath: string,
    options?: { folder?: string; publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options?.folder ?? 'scouttalk',
      public_id: options?.publicId,
      resource_type: 'raw',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
