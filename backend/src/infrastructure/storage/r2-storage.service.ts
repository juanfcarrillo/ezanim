import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class R2StorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn(
        '[R2StorageService] R2 credentials not configured, using mock mode',
      );
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = process.env.R2_BUCKET_NAME || 'ezanim-videos';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    console.log('[R2StorageService] Initialized with bucket:', this.bucketName);
  }

  async uploadVideo(filePath: string, key: string): Promise<string> {
    console.log('[R2StorageService] Uploading video:', key);

    // Mock mode if client not configured
    if (!this.client) {
      console.log('[R2StorageService] Mock upload - no credentials configured');
      return `mock://${key}`;
    }

    // Read file
    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4',
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.client.send(command);
    console.log('[R2StorageService] Upload complete:', key);

    return key;
  }

  async getPublicUrl(key: string): Promise<string> {
    // If public URL is configured, use it
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // Otherwise return signed URL
    return this.getSignedUrl(key, 86400); // 24 hours
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client) {
      return `mock://signed-url/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
    return signedUrl;
  }

  async deleteVideo(key: string): Promise<void> {
    if (!this.client) {
      console.log('[R2StorageService] Mock delete:', key);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
    console.log('[R2StorageService] Deleted:', key);
  }
}
