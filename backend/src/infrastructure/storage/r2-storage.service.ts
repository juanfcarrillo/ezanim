import { Injectable } from '@nestjs/common';

@Injectable()
export class R2StorageService {
  constructor() {
    // TODO: Initialize R2 client with credentials from env
    // R2 uses S3-compatible API, so we can use @aws-sdk/client-s3
    // Configure endpoint to: https://<account_id>.r2.cloudflarestorage.com
  }

  async uploadVideo(filePath: string, key: string): Promise<string> {
    // TODO: Implement R2 upload logic
    // 1. Read video file
    // 2. Upload to R2 bucket using S3-compatible API
    // 3. Return R2 key
    throw new Error('Not implemented');
  }

  async getPublicUrl(key: string): Promise<string> {
    // TODO: Return public URL for video
    // R2 supports public buckets with custom domains
    throw new Error('Not implemented');
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // TODO: Generate presigned URL for private video download
    // Uses same API as S3 presigned URLs
    throw new Error('Not implemented');
  }

  async deleteVideo(key: string): Promise<void> {
    // TODO: Delete video from R2
    throw new Error('Not implemented');
  }
}
