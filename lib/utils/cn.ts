import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names; never returns `null` (safe for hydration). */
export function cn(...inputs: ClassValue[]) {
  const merged = twMerge(clsx(inputs));
  return merged.length > 0 ? merged : undefined;
}
