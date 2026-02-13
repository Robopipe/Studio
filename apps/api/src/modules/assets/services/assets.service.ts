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
  public getAssetName(fileName: string, projectId: number, type: 'asset' | 'thumbnail'): string {
    if (type === 'thumbnail') {
      const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
      return `${projectId}/thumbnails/${uuidv4()}_${nameWithoutExt}.webp`
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
