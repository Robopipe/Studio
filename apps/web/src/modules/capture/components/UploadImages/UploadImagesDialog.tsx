import { cn } from "@/lib/utils";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import type { TaskUploadContentType } from "@repo/schema";
import { ImageUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { EnqueueImageUpload } from "../../hooks/useUploadTaskImages";
import { useImportTasksMutation } from "../../services/captureApi";
import {
  ACCEPTED_IMAGE_TYPES,
  formatFileSize,
  validateImageFiles,
} from "../../utils/imageFileValidation";
import { ImportFromProjectsTab } from "./ImportFromProjectsTab";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
}

type UploadTab = "device" | "projects";

// Server-side cap on taskIds per import request (importTasksSchema).
const IMPORT_CHUNK_SIZE = 100;

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
  const [activeProject] = useActiveProject();
  const [importTasks] = useImportTasksMutation();

  const [tab, setTab] = useState<UploadTab>("device");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [skippedNotice, setSkippedNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  // Lifted here (not in the tab) because inactive tab panels unmount —
  // the selection must survive switching back to the device tab.
  const [importSelection, setImportSelection] = useState<
    Map<number, Set<number>>
  >(new Map());
  const [isImporting, setIsImporting] = useState(false);
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
    setImportSelection(new Map());
    setTab("device");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      if (isImporting) return;
      reset();
    }
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

  const importTotal = [...importSelection.values()].reduce(
    (sum, ids) => sum + ids.size,
    0,
  );
  const importProjectCount = importSelection.size;

  const handleImport = async () => {
    if (!activeProject || importTotal === 0) return;

    setIsImporting(true);
    let importedCount = 0;
    const failedByProject = new Map<number, Set<number>>();
    const failReasons = new Set<string>();

    const addFailed = (sourceProjectId: number, ids: number[], reason: string) => {
      const set = failedByProject.get(sourceProjectId) ?? new Set<number>();
      ids.forEach((id) => set.add(id));
      failedByProject.set(sourceProjectId, set);
      failReasons.add(reason);
    };

    try {
      for (const [sourceProjectId, ids] of importSelection) {
        const idList = [...ids];
        for (let i = 0; i < idList.length; i += IMPORT_CHUNK_SIZE) {
          const chunk = idList.slice(i, i + IMPORT_CHUNK_SIZE);
          try {
            const result = await importTasks({
              projectId: activeProject.id,
              sourceProjectId,
              taskIds: chunk,
            }).unwrap();
            importedCount += result.imported.length;
            result.failed.forEach((f) =>
              addFailed(sourceProjectId, [f.sourceTaskId], f.reason),
            );
          } catch {
            addFailed(sourceProjectId, chunk, "Request failed");
          }
        }
      }
    } finally {
      setIsImporting(false);
    }

    const failedTotal = [...failedByProject.values()].reduce(
      (sum, ids) => sum + ids.size,
      0,
    );
    const imagesWord = (n: number) => (n === 1 ? "image" : "images");

    if (failedTotal === 0) {
      toast.success(`Imported ${importedCount} ${imagesWord(importedCount)}`);
      if (staged.length > 0) {
        // Don't discard files still staged on the device tab.
        setImportSelection(new Map());
        setTab("device");
      } else {
        handleOpenChange(false);
      }
    } else {
      const reasonHint =
        failReasons.size === 1
          ? ` (${[...failReasons][0].toLowerCase()})`
          : "";
      toast.warning(
        `Imported ${importedCount} ${imagesWord(importedCount)}, ${failedTotal} failed${reasonHint}. Failed images stay selected.`,
      );
      // Keep only the failed ids selected so the user can retry.
      setImportSelection(failedByProject);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          tab === "projects" &&
            "flex h-[85vh] max-w-[min(1100px,calc(100vw-4rem))]! flex-col",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Upload images</DialogTitle>
          <DialogDescription>
            {tab === "device"
              ? "Add JPEG, PNG or WebP images up to 20 MB each. They will be added to the project's dataset."
              : "Import images from another project in your organization. They will be copied into the project's dataset."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as UploadTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList variant="line" className="px-0">
            <TabsTrigger value="device">From device</TabsTrigger>
            <TabsTrigger value="projects">From projects</TabsTrigger>
          </TabsList>

          <TabsContent value="device" className="flex flex-col gap-4 pt-2">
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
          </TabsContent>

          <TabsContent
            value="projects"
            className="flex min-h-0 flex-1 flex-col pt-2"
          >
            <ImportFromProjectsTab
              selection={importSelection}
              onSelectionChange={setImportSelection}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter
          className={cn(tab === "projects" && "items-center sm:justify-between")}
        >
          {tab === "device" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={staged.length === 0}
              >
                Upload{staged.length > 0 ? ` (${staged.length})` : ""}
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-foreground/60">
                {importTotal} selected
                {importProjectCount > 1
                  ? ` from ${importProjectCount} projects`
                  : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importTotal === 0 || isImporting}
                >
                  {isImporting
                    ? "Importing..."
                    : `Import${importTotal > 0 ? ` (${importTotal})` : ""}`}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
