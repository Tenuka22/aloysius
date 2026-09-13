import { completeUpload } from "./complete-upload";
import { deleteFile } from "./delete-file";
import { getUploadUrl } from "./get-upload-url";
import { listFiles } from "./list-files";

export const filesRouter = {
  getUploadUrl,
  completeUpload,
  listFiles,
  deleteFile,
};
