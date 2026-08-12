import { useCallback, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadIcon, FileTextIcon, ImageIcon, FilmIcon, MusicIcon, FileIcon } from "lucide-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@aloysius-web/ui/components/attachment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { Button } from "@aloysius-web/ui/components/button";
import { ImageCropDialog } from "@aloysius-web/ui/components/image-crop-dialog";
import { client } from "@/utils/orpc";

type UploadState = "idle" | "uploading" | "processing" | "error" | "done";

interface PendingFile {
  file: File;
  id: string;
  preview?: string;
  state: UploadState;
  progress?: number;
  url?: string;
  error?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
}

export interface FileUploadProps {
  queryKey?: string[];
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon />;
  if (type.startsWith("video/")) return <FilmIcon />;
  if (type.startsWith("audio/")) return <MusicIcon />;
  if (type.includes("pdf")) return <FileTextIcon />;
  if (type.includes("zip") || type.includes("rar")) return <FileIcon />;
  return <FileTextIcon />;
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "";
}

function isImageFile(type: string): boolean {
  return type.startsWith("image/");
}

export function FileUpload({
  queryKey = ["files", "list"],
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  className,
}: FileUploadProps) {
  const queryClient = useQueryClient();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [infoFile, setInfoFile] = useState<PendingFile | UploadedFile | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const { data: existingFiles = [] } = useQuery({
    queryKey,
    queryFn: () => client.files.listFiles(),
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const allFiles = [...existingFiles, ...uploadedFiles];

  const removeUploadedFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.files.deleteFile({ id }),
    onSuccess: (_data, id) => {
      removeUploadedFile(id);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const uploadFile = useCallback(async (entry: PendingFile) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, state: "uploading" as const, progress: 0 } : f)),
    );

    try {
      const result = await client.files.uploadFile(entry.file);

      setPendingFiles((prev) => prev.filter((f) => f.id !== entry.id));

      setUploadedFiles((prev) => [
        ...prev,
        {
          id: result.id,
          name: result.name,
          size: result.size,
          type: result.type,
          url: result.url,
          createdAt: result.createdAt,
        },
      ]);
    } catch (err) {
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id
            ? {
                ...f,
                state: "error" as const,
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : f,
        ),
      );
    }
  }, []);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const newEntries: PendingFile[] = files.map((file) => ({
        file,
        id: crypto.randomUUID(),
        state: "idle" as const,
      }));

      setPendingFiles((prev) => [...prev, ...newEntries]);

      for (const entry of newEntries) {
        if (isImageFile(entry.file.type)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setPendingFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, preview } : f)));
          };
          reader.readAsDataURL(entry.file);
        }
        uploadFile(entry);
      }
    },
    [uploadFile],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const pending = pendingFiles.find((f) => f.id === id);
      if (pending?.preview) {
        URL.revokeObjectURL(pending.preview);
      }
      setPendingFiles((prev) => prev.filter((f) => f.id !== id));
      removeUploadedFile(id);

      const uploaded = allFiles.find((f) => f.id === id);
      if (uploaded) {
        deleteMutation.mutate(id);
      }
    },
    [pendingFiles, allFiles, removeUploadedFile, deleteMutation],
  );

  const handleInfo = useCallback((file: PendingFile | UploadedFile) => {
    setInfoFile(file);
    setInfoOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      for (const entry of pendingFiles) {
        if (entry.preview) URL.revokeObjectURL(entry.preview);
      }
    };
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <Dropzone onFilesSelected={handleFilesSelected} maxFiles={maxFiles} maxSize={maxSize} />

      <PreviewList
        files={pendingFiles}
        uploadedFiles={uploadedFiles}
        onRemove={handleRemove}
        onInfo={handleInfo}
      />

      <InfoDialog file={infoFile} open={infoOpen} onOpenChange={setInfoOpen} />
    </div>
  );
}

export function Dropzone({
  onFilesSelected,
  maxFiles,
  maxSize,
  className,
  disabled = false,
  crop = false,
  aspect = 16 / 9,
  cropTitle = "Crop Image",
}: {
  onFilesSelected: (files: File[]) => void;
  maxFiles: number;
  maxSize: number;
  className?: string;
  disabled?: boolean;
  crop?: boolean;
  aspect?: number;
  cropTitle?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).slice(0, maxFiles);
      const valid = files.filter((f) => f.size <= maxSize);

      if (crop && valid.length === 1 && isImageFile(valid[0]!.type)) {
        setPendingFile(valid[0]!);
        setCropOpen(true);
      } else {
        onFilesSelected(valid);
      }
    },
    [maxFiles, maxSize, crop, onFilesSelected],
  );

  const handleCropComplete = useCallback(
    (file: File) => {
      setPendingFile(null);
      setCropOpen(false);
      onFilesSelected([file]);
    },
    [onFilesSelected],
  );

  const aspectClass =
    aspect === 16 / 9
      ? "aspect-video"
      : aspect === 4 / 3
        ? "aspect-[4/3]"
        : aspect === 1
          ? "aspect-square"
          : "";

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50",
          aspectClass,
          className,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <UploadIcon className="size-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Click to upload</span> or drag and drop
        </div>
        <div className="text-xs text-muted-foreground">
          Max {formatFileSize(maxSize)} per file, up to {maxFiles} files
        </div>
      </div>
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        file={pendingFile}
        onCropComplete={handleCropComplete}
        aspect={aspect}
        title={cropTitle}
      />
    </>
  );
}

function PreviewList({
  files,
  uploadedFiles,
  onRemove,
  onInfo,
}: {
  files: PendingFile[];
  uploadedFiles: UploadedFile[];
  onRemove: (id: string) => void;
  onInfo: (file: PendingFile | UploadedFile) => void;
}) {
  if (files.length === 0 && uploadedFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {files.map((f) => (
        <Attachment key={f.id} state={f.state} orientation="vertical" className="w-24">
          <AttachmentMedia variant={f.preview && isImageFile(f.file.type) ? "image" : "icon"}>
            {f.preview && isImageFile(f.file.type) ? (
              <img src={f.preview} alt={f.file.name} />
            ) : (
              getFileIcon(f.file.type)
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{f.file.name}</AttachmentTitle>
            <AttachmentDescription>
              {f.state === "uploading"
                ? `Uploading ${f.progress ?? 0}%`
                : f.state === "error"
                  ? (f.error ?? "Failed")
                  : f.state === "done"
                    ? "Uploaded"
                    : `${getExtension(f.file.name)} · ${formatFileSize(f.file.size)}`}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            {f.state === "done" && f.url && (
              <AttachmentAction
                aria-label={`Info ${f.file.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo(f);
                }}
                className="bg-background/80 backdrop-blur hover:bg-background"
              >
                <FileTextIcon />
              </AttachmentAction>
            )}
            <AttachmentAction
              aria-label={`Remove ${f.file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(f.id);
              }}
              className="bg-background/80 backdrop-blur hover:bg-destructive/20 hover:text-destructive"
            >
              <span className="sr-only">Remove</span>×
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}

      {uploadedFiles.map((f) => (
        <Attachment key={f.id} state="done" orientation="vertical" className="w-24">
          <AttachmentMedia variant={isImageFile(f.type) ? "image" : "icon"}>
            {isImageFile(f.type) ? <img src={f.url} alt={f.name} /> : getFileIcon(f.type)}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{f.name}</AttachmentTitle>
            <AttachmentDescription>
              {getExtension(f.name)} · {formatFileSize(f.size)}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label={`Info ${f.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onInfo(f);
              }}
              className="bg-background/80 backdrop-blur hover:bg-background"
            >
              <FileTextIcon />
            </AttachmentAction>
            <AttachmentAction
              aria-label={`Remove ${f.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(f.id);
              }}
              className="bg-background/80 backdrop-blur hover:bg-destructive/20 hover:text-destructive"
            >
              <span className="sr-only">Remove</span>×
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  );
}

function InfoDialog({
  file,
  open,
  onOpenChange,
}: {
  file: PendingFile | UploadedFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!file) return null;

  const isPending = "file" in file;
  const name = isPending ? file.file.name : file.name;
  const size = isPending ? file.file.size : file.size;
  const type = isPending ? file.file.type : file.type;
  const url = isPending ? file.url : file.url;
  const createdAt = isPending ? undefined : file.createdAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Details</DialogTitle>
          <DialogDescription>Information about {name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isImageFile(type) && url && (
            <div className="overflow-hidden rounded-lg border">
              <img src={url} alt={name} className="w-full object-contain max-h-64" />
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium truncate max-w-[200px]">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{type || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{formatFileSize(size)}</span>
            </div>
            {createdAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span className="font-medium">{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {url && (
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
