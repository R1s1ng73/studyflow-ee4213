import { format } from "date-fns";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);

  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return parsed;
}

export function formatDateOnly(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function compareDateOnly(left: string, right: string): number {
  return left.localeCompare(right);
}
