import { CapturedVideoSelect } from "../../../repository/types/captured-video";
import { CapturedVideo } from "@repo/schema";

export class CapturedVideoEntity {
  readonly id: number;
  readonly projectId: number;
  readonly fileUrl: string;
  readonly thumbnailUrl: string;
  readonly durationMs: number;
  readonly fileSizeBytes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: CapturedVideoSelect) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.fileUrl = data.fileUrl;
    this.thumbnailUrl = data.thumbnailUrl;
    this.durationMs = data.durationMs;
    this.fileSizeBytes = data.fileSizeBytes;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  public toResponse(): CapturedVideo {
    return {
      id: this.id,
      projectId: this.projectId,
      fileUrl: this.fileUrl,
      thumbnailUrl: this.thumbnailUrl,
      durationMs: this.durationMs,
      fileSizeBytes: this.fileSizeBytes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
