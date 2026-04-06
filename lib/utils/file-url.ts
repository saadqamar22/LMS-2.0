/**
 * Utility functions for handling file URLs
 */

/**
 * Convert a storage URL to API route URL if needed
 * Handles both old direct storage URLs and new API route URLs
 */
export function normalizeFileUrl(fileUrl: string | null | undefined, bucket: "assignments" | "submissions"): string | null {
  if (!fileUrl) return null;

  // If it's already an API route URL, return as is
  if (fileUrl.startsWith("/api/files")) {
    return fileUrl;
  }

  // If it's a Supabase storage URL, extract the path and convert to API route
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]
  const storageUrlPattern = /\/storage\/v1\/object\/(?:public|sign)\/([^\/]+)\/(.+)$/;
  const match = fileUrl.match(storageUrlPattern);

  if (match && match[1] === bucket && match[2]) {
    const path = decodeURIComponent(match[2]);
    return `/api/files?bucket=${bucket}&path=${encodeURIComponent(path)}`;
  }

  // If it's a relative path (just the path without domain), use it directly
  if (!fileUrl.startsWith("http")) {
    return `/api/files?bucket=${bucket}&path=${encodeURIComponent(fileUrl)}`;
  }

  // If we can't parse it, return as is (might be a different URL format)
  return fileUrl;
}

