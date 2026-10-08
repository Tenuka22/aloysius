import { completeUpload } from "./complete-upload";
import { deleteFile } from "./delete-file";
import { getUploadUrl } from "./get-upload-url";
import { listFiles } from "./list-files";
import { resolveUrls } from "./resolve-urls";

export const filesRouter = {
  getUploadUrl,
  completeUpload,
  resolveUrls,
  listFiles,
  deleteFile,
};
