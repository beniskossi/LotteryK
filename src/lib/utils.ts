import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the Tailwind CSS background color class based on the lottery ball number.
 * Uses fixed color assignments based on ranges.
 * @param number - The lottery ball number (1-90).
 * @returns Tailwind background color class string.
 */
export function getBallColorClass(number: number): string {
  if (number >= 1 && number <= 10) return 'bg-red-600';
  if (number >= 11 && number <= 20) return 'bg-blue-600';
  if (number >= 21 && number <= 30) return 'bg-green-600'; // Use primary green
  if (number >= 31 && number <= 40) return 'bg-yellow-500';
  if (number >= 41 && number <= 50) return 'bg-purple-600';
  if (number >= 51 && number <= 60) return 'bg-orange-500';
  if (number >= 61 && number <= 70) return 'bg-cyan-500';
  if (number >= 71 && number <= 80) return 'bg-pink-500';
  if (number >= 81 && number <= 90) return 'bg-gray-500';
  return 'bg-gray-400'; // Default fallback
}
