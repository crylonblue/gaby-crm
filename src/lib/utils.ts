import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Drive URL to a viewer URL
 * Handles various Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/edit
 * - https://drive.google.com/uc?export=download&id=FILE_ID
 * - Direct file ID
 */
export function getGoogleDriveViewerUrl(url: string): string {
  if (!url) return url;

  // Extract file ID from various Google Drive URL formats
  let fileId = "";

  // Pattern 1: /file/d/FILE_ID/ or /file/d/FILE_ID?
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    fileId = fileIdMatch[1];
  } else {
    // Pattern 2: ?id=FILE_ID or &id=FILE_ID
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch) {
      fileId = idParamMatch[1];
    } else {
      // Pattern 3: Assume the URL itself is a file ID if it's a short alphanumeric string
      const cleanUrl = url.trim();
      if (/^[a-zA-Z0-9_-]+$/.test(cleanUrl) && cleanUrl.length > 10) {
        fileId = cleanUrl;
      } else {
        // If we can't extract a file ID, return the original URL
        return url;
      }
    }
  }

  // Return Google Drive viewer URL
  return `https://drive.google.com/file/d/${fileId}/view`;
}
