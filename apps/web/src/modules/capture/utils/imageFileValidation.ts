import type { TaskUploadContentType } from "@repo/schema";

export const ACCEPTED_IMAGE_TYPES: TaskUploadContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export interface RejectedImageFile {
  file: File;
  reason: "type" | "size";
}

export interface ImageFileValidationResult {
  accepted: File[];
  rejected: RejectedImageFile[];
}

/**
 * The `accept` attribute on file inputs is advisory and drag-and-drop
 * bypasses it entirely, so file types are always re-checked here. An empty
 * `file.type` counts as a type rejection.
 */
export const validateImageFiles = (files: File[]): ImageFileValidationResult => {
  const accepted: File[] = [];
  const rejected: RejectedImageFile[] = [];

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as TaskUploadContentType)) {
      rejected.push({ file, reason: "type" });
    } else if (file.size > MAX_IMAGE_FILE_SIZE) {
      rejected.push({ file, reason: "size" });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
