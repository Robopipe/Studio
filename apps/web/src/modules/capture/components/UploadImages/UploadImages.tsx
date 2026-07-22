import type { TaskUploadContentType } from "@repo/schema";
import { ImageUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUploadTaskImages } from "../../hooks/useUploadTaskImages";
import { validateImageFiles } from "../../utils/imageFileValidation";
import { UploadImagesDialog } from "./UploadImagesDialog";

/**
 * Drop zone in the capture-settings sidebar. Dropping images uploads them
 * immediately; clicking opens a dialog with drag-and-drop plus a file
 * picker where files are staged before upload.
 */
export const UploadImages = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { enqueueUploads } = useUploadTaskImages();

  const uploadFiles = (files: File[]) => {
    enqueueUploads(
      files.map((file) => ({
        blob: file,
        filename: file.name,
        contentType: file.type as TaskUploadContentType,
      })),
    );
  };

  const handleDrop = (files: File[]) => {
    const { accepted, rejected } = validateImageFiles(files);
    if (rejected.length > 0) {
      toast.error(
        rejected.length === 1
          ? `${rejected[0].file.name} skipped — only JPEG, PNG or WebP up to 20 MB`
          : `${rejected.length} files skipped — only JPEG, PNG or WebP up to 20 MB`,
      );
    }
    if (accepted.length > 0) {
      uploadFiles(accepted);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDialogOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDialogOpen(true);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleDrop(Array.from(e.dataTransfer.files));
        }}
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors ${
          isDragOver
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-black/20 hover:bg-black/5"
        }`}
      >
        <ImageUp className="h-4 w-4" />
        Upload images
      </div>

      <UploadImagesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpload={enqueueUploads}
      />
    </>
  );
};
