import { toast } from "react-hot-toast";
import { APP_CONFIG } from "../config/appConfig";

export function validateFiles(files: FileList | File[] | null): File[] {
  if (!files) return [];

  const { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB } = APP_CONFIG.UPLOAD_RULES;
  const validFiles: File[] = [];

  for (const file of Array.from(files)) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const sizeMB = file.size / (1024 * 1024);

    if (!SUPPORTED_FILE_TYPES.includes(ext)) {
      toast.error(`Unsupported file type: ${ext}. Allowed: ${SUPPORTED_FILE_TYPES.join(", ")}`);
      continue;
    }

    if (sizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File too large (${sizeMB.toFixed(1)} MB). Max size: ${MAX_FILE_SIZE_MB} MB.`);
      continue;
    }

    validFiles.push(file);
  }

  return validFiles;
}
