import { Injectable, Logger } from "@nestjs/common";
import { Bucket, Storage } from "@google-cloud/storage";
import { AppConfig } from "../../../core/configuration/app.config";
import {v4 as uuidv4} from 'uuid'
import { ModelOutputTypeEnum } from "@repo/schema";

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name)
  private readonly storage: Storage;
  private readonly bucket: Bucket

  constructor(config: AppConfig) {
    this.storage = new Storage();
    this.bucket = this.storage.bucket(config.bucketName)
  }

  /**
   * Get asset name for a given type
   * @param fileName
   * @param projectId
   * @param type - 'asset' or 'thumbnail'
   */
  public getAssetName(fileName: string, projectId: number, type: 'asset' | 'thumbnail' | 'video'): string {
    if (type === 'thumbnail') {
      const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
      return `${projectId}/thumbnails/${uuidv4()}_${nameWithoutExt}.webp`
    }
    if (type === 'video') {
      return `${projectId}/videos/${uuidv4()}_${fileName}`
    }
    return `${projectId}/assets/${uuidv4()}_${fileName}`
  }

  /**
   * Get model output file name
   * @param fileName - for extension
   * @param projectId
   * @param modelId
   * @param type - ModelOutputTypeEnum
   * @returns google cloud storage  model path
   */
  public getModelOutputName(fileName: string, projectId: number, modelId: number, type: ModelOutputTypeEnum): string {
    const [_, ...parts] = fileName.split('.')
    return `${projectId}/model/${modelId}/${type.toLowerCase()}/${uuidv4()}.${parts.join('.')}`
  }

  /**
   * Build a pre-training GCS object path for a model output.
   * Filename convention matches what the ML service produces:
   *   - RAW  -> {uuid}.onnx.tar.xz
   *   - RVC* -> {uuid}.{type_lower}.tar.xz
   */
  public getModelOutputPath(projectId: number, modelId: number, type: ModelOutputTypeEnum): string {
    const typeLower = type.toLowerCase();
    const ext = type === ModelOutputTypeEnum.RAW ? "onnx.tar.xz" : `${typeLower}.tar.xz`;
    return `${projectId}/model/${modelId}/${typeLower}/${uuidv4()}.${ext}`;
  }

  /**
   * Public URL for a GCS object (all objects in this bucket are public-read).
   */
  public getPublicUrl(objectPath: string): string {
    return decodeURIComponent(this.bucket.file(objectPath).publicUrl());
  }

  /**
   * Save buffer to Google cloud storage
   * @param buffer - file buffer
   * @param contentType - MIME type
   * @param assetName - file name
   */
  public async saveFile(buffer: Buffer, contentType: string, assetName: string): Promise<string>{
    const blob = this.bucket.file(assetName)
    await blob.save(buffer, {
      contentType
    })
    await blob.makePublic()

    return decodeURIComponent(blob.publicUrl())
  }

  /**
   * Generate a signed URL for direct browser-to-GCS upload
   * @param assetName - GCS object path
   * @param contentType - MIME type the client will upload
   * @param expiresInMs - URL expiration (default 15 minutes)
   */
  public async generateSignedUploadUrl(
    assetName: string,
    contentType: string,
    expiresInMs: number = 15 * 60 * 1000,
  ): Promise<string> {
    const file = this.bucket.file(assetName);
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + expiresInMs,
      contentType,
    });
    return signedUrl;
  }

  /**
   * Make an existing GCS file public and return its public URL
   * @param assetName - GCS object path
   */
  public async makeFilePublic(assetName: string): Promise<string> {
    const blob = this.bucket.file(assetName);
    await blob.makePublic();
    return decodeURIComponent(blob.publicUrl());
  }

  /**
   * Check if a file exists in GCS
   * @param assetName - GCS object path
   */
  public async fileExists(assetName: string): Promise<boolean> {
    const [exists] = await this.bucket.file(assetName).exists();
    return exists;
  }

  /**
   * Download an object's bytes from GCS.
   */
  public async downloadFile(assetName: string): Promise<Buffer> {
    const [buffer] = await this.bucket.file(assetName).download();
    return buffer;
  }

  /**
   * Delete file from GS
   * @param fileUrl - whole file URL
   */
  public async deleteFile(fileUrl: string): Promise<void>{
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const filePath = pathParts.slice(1).join('/');

      await this.bucket.file(filePath).delete();
    } catch(e){
      this.logger.error(`Failed deleting file from google cloud storage. File: ${fileUrl}. Ignoring, probably deleted already`, e)
    }
  }
}
