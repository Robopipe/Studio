import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import type { TaskUploadContentType } from "@repo/schema";
import { ImageUp, X } from "lucide-react";
import { useRef, useState } from "react";
import type { EnqueueImageUpload } from "../../hooks/useUploadTaskImages";
import {
  ACCEPTED_IMAGE_TYPES,
  formatFileSize,
  validateImageFiles,
} from "../../utils/imageFileValidation";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface UploadImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (items: EnqueueImageUpload[]) => void;
}

const buildSkippedNotice = (
  rejected: { file: File; reason: "type" | "size" }[],
): string => {
  const parts = rejected.map(
    ({ file, reason }) =>
      `${file.name} (${reason === "type" ? "unsupported type" : "over 20 MB"})`,
  );
  return `Skipped ${parts.join(", ")}`;
};

export const UploadImagesDialog = ({
  open,
  onOpenChange,
  onUpload,
}: UploadImagesDialogProps) => {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [skippedNotice, setSkippedNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    const { accepted, rejected } = validateImageFiles(files);
    setSkippedNotice(rejected.length > 0 ? buildSkippedNotice(rejected) : null);
    if (accepted.length > 0) {
      setStaged((prev) => [
        ...prev,
        ...accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    }
  };

  const removeStaged = (id: string) => {
    setStaged((prev) => {
      const entry = prev.find((s) => s.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  };

  const reset = () => {
    staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    setStaged([]);
    setSkippedNotice(null);
    setIsDragOver(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleUpload = () => {
    onUpload(
      staged.map(({ file }) => ({
        blob: file,
        filename: file.name,
        contentType: file.type as TaskUploadContentType,
      })),
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Upload images</DialogTitle>
          <DialogDescription>
            Add JPEG, PNG or WebP images up to 20 MB each. They will be added
            to the project's dataset.
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
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
            addFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground transition-colors ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-black/20 hover:bg-black/5"
          }`}
        >
          <ImageUp className="h-6 w-6" />
          <span>Drop images here or click to browse</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            // Reset so re-picking the same file fires change again.
            e.target.value = "";
          }}
        />

        {skippedNotice && (
          <p className="text-xs text-destructive">{skippedNotice}</p>
        )}

        {staged.length > 0 && (
          <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
            {staged.map(({ id, file, previewUrl }) => (
              <li key={id} className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="h-10 w-10 rounded object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeStaged(id)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={staged.length === 0}>
            Upload{staged.length > 0 ? ` (${staged.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
