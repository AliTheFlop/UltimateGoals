import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Returns a YYYY-MM-DD string based on the local timezone
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfWeekDate(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  // Adjust to Monday start
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Returns a YYYY-MM-DD string representing the start (Monday) of the week for the given local date
export function getStartOfWeekString(d: Date = new Date()): string {
  return getLocalDateString(getStartOfWeekDate(d));
}
