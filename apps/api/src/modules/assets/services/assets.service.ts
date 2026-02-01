import { Injectable } from "@nestjs/common";
import { Bucket, Storage } from "@google-cloud/storage";
import { AppConfig } from "../../../core/configuration/app.config";
import {v4 as uuidv4} from 'uuid'

@Injectable()
export class AssetsService {
  private readonly storage: Storage;
  private readonly bucket: Bucket

  constructor(config: AppConfig) {
    this.storage = new Storage();
    this.bucket = this.storage.bucket(config.bucketName)
  }

  /**
   * Get asset name
   * @param fileName
   * @param projectId
   */
  public getAssetName(fileName: string, projectId: number): string {
    return `${projectId}/${uuidv4()}_${fileName}`
  }

  /**
   * Save file to Google cloud storage
   * @param fileData - Multer file
   * @param assetName - file name
   */
  public async saveFile(fileData: Express.Multer.File, assetName: string): Promise<string>{
    const blob = this.bucket.file(assetName)
    await blob.save(fileData.buffer, {
      contentType: fileData.mimetype
    })
    await blob.makePublic()

    return blob.publicUrl()
  }
}
