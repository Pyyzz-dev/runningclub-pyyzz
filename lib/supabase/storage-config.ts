export const STORAGE_BUCKET_NAME = "Running Club - CMC Global";
export const STORAGE_BASE_FOLDER = "History&Introduce";
export const HERO_SECTION_FOLDER = "HeroSection";

/** Thư mục con trong `History&Introduce` */
export type StorageSubFolder = "introduce" | "history" | "posts";

export function buildStoragePath(subFolder: StorageSubFolder, fileName: string): string {
  return `${STORAGE_BASE_FOLDER}/${subFolder}/${fileName}`;
}

export function isStorageSubFolder(value: string): value is StorageSubFolder {
  return value === "introduce" || value === "history" || value === "posts";
}
