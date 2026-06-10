export const STORAGE_BUCKET_NAME = "Running Club - CMC Global";
export const STORAGE_BASE_FOLDER = "History&Introduce";
export const HERO_SECTION_FOLDER = "HeroSection";
export const EVENTS_FOLDER = "events";

/** Thư mục con trong `History&Introduce` */
export type StorageSubFolder = "introduce" | "history" | "posts";

/** Thư mục upload — `events` nằm ở root bucket */
export type StorageUploadFolder = StorageSubFolder | "events";

export function buildStoragePath(subFolder: StorageSubFolder, fileName: string): string {
  return `${STORAGE_BASE_FOLDER}/${subFolder}/${fileName}`;
}

export function buildEventStoragePath(fileName: string): string {
  return `${EVENTS_FOLDER}/${fileName}`;
}

export function isStorageSubFolder(value: string): value is StorageSubFolder {
  return value === "introduce" || value === "history" || value === "posts";
}

export function isStorageUploadFolder(value: string): value is StorageUploadFolder {
  return isStorageSubFolder(value) || value === "events";
}
