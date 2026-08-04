import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an integer/decimal amount as workshop currency.
 * Defaults to PKR with no decimal places, since rupee invoices in this
 * context are essentially always whole numbers.
 */
export function formatCurrency(amount: number, currency: string = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function normalizeRegNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}
