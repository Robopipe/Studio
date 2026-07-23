import { Bucket, Storage } from "@google-cloud/storage";
import { Injectable, Logger } from "@nestjs/common";
import { ModelOutputTypeEnum } from "@repo/schema";
import { v4 as uuidv4 } from "uuid";
import { AppConfig } from "../../../core/configuration/app.config";

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(config: AppConfig) {
    this.storage = new Storage();
    this.bucket = this.storage.bucket(config.bucketName);
  }

  /**
   * Get asset name for a given type
   * @param fileName
   * @param projectId
   * @param type - 'asset' or 'thumbnail'
   */
  public getAssetName(
    fileName: string,
    projectId: number,
    type: "asset" | "thumbnail" | "video",
  ): string {
    if (type === "thumbnail") {
      const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
      return `${projectId}/thumbnails/${uuidv4()}_${nameWithoutExt}.webp`;
    }
    if (type === "video") {
      return `${projectId}/videos/${uuidv4()}_${fileName}`;
    }
    return `${projectId}/assets/${uuidv4()}_${fileName}`;
  }

  /**
   * Get model output file name
   * @param fileName - for extension
   * @param projectId
   * @param modelId
   * @param type - ModelOutputTypeEnum
   * @returns google cloud storage  model path
   */
  public getModelOutputName(
    fileName: string,
    projectId: number,
    modelId: number,
    type: ModelOutputTypeEnum,
  ): string {
    const [_, ...parts] = fileName.split(".");
    return `${projectId}/model/${modelId}/${type.toLowerCase()}/${uuidv4()}.${parts.join(".")}`;
  }

  /**
   * Build a pre-training GCS object path for a model output.
   * Filename convention matches what the ML service produces:
   *   - RAW  -> {uuid}.onnx.tar.xz
   *   - RVC* -> {uuid}.{type_lower}.tar.xz
   */
  public getModelOutputPath(
    projectId: number,
    modelId: number,
    type: ModelOutputTypeEnum,
  ): string {
    const typeLower = type.toLowerCase();
    const ext =
      type === ModelOutputTypeEnum.RAW ? "onnx.tar.xz" : `${typeLower}.tar.xz`;
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
  public async saveFile(
    buffer: Buffer,
    contentType: string,
    assetName: string,
  ): Promise<string> {
    const blob = this.bucket.file(assetName);
    await blob.save(buffer, {
      contentType,
    });
    await blob.makePublic();

    return decodeURIComponent(blob.publicUrl());
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
   * Generate a short-lived signed read URL. Used to hand the ml-infer
   * Cloud Run service a fetch token for an image or model archive
   * without granting it persistent IAM on the bucket.
   * @param assetName - GCS object path or full GCS URL
   * @param expiresInMs - URL expiration (default 5 minutes)
   */
  public async generateSignedDownloadUrl(
    assetName: string,
    expiresInMs: number = 5 * 60 * 1000,
  ): Promise<string> {
    const objectPath = this.toObjectPath(assetName);
    const file = this.bucket.file(objectPath);
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInMs,
    });
    return signedUrl;
  }

  /**
   * Server-side GCS object-to-object copy — no bytes leave the bucket.
   * @param source - GCS object path or full public URL
   * @param destObjectPath - destination GCS object path
   * @returns public URL of the copied object
   */
  public async copyFile(
    source: string,
    destObjectPath: string,
  ): Promise<string> {
    const sourcePath = this.toObjectPath(source);
    const [copied] = await this.bucket
      .file(sourcePath)
      .copy(this.bucket.file(destObjectPath));
    await copied.makePublic();
    return decodeURIComponent(copied.publicUrl());
  }

  /**
   * gs:// URI for an object — the form Vertex AI accepts as fileData.fileUri.
   * @param input - GCS object path or full public URL
   */
  public toGsUri(input: string): string {
    return `gs://${this.bucket.name}/${this.toObjectPath(input)}`;
  }

  private toObjectPath(input: string): string {
    if (!input.startsWith("http")) return input;
    try {
      const url = new URL(input);
      const prefix = `/${this.bucket.name}/`;
      if (url.pathname.startsWith(prefix)) {
        return decodeURIComponent(url.pathname.slice(prefix.length));
      }
      return decodeURIComponent(url.pathname.replace(/^\//, ""));
    } catch {
      return input;
    }
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
  public async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const filePath = pathParts.slice(1).join("/");

      await this.bucket.file(filePath).delete();
    } catch (e) {
      this.logger.error(
        `Failed deleting file from google cloud storage. File: ${fileUrl}. Ignoring, probably deleted already`,
        e,
      );
    }
  }
}
