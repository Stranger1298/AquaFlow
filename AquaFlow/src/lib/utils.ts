import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default image to use as fallback
export const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=800&auto=format&fit=crop"
