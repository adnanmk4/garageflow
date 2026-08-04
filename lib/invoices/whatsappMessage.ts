import { formatCurrency } from "@/lib/utils";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export function buildWhatsappMessage(invoiceNumber: string, snapshot: InvoiceSnapshot): string {
  const { workshop, vehicle, job } = snapshot;

  const lines = [
    `Hello,`,
    ``,
    `Your vehicle has been serviced successfully.`,
    ``,
    `Vehicle: ${vehicle.regNumber}`,
    `Invoice: #${invoiceNumber}`,
    `Total: ${formatCurrency(job.grandTotal, workshop.currency)}`,
  ];

  if (job.balanceRemaining > 0) {
    lines.push(`Balance Remaining: ${formatCurrency(job.balanceRemaining, workshop.currency)}`);
  }

  lines.push(``, `Thank you for choosing ${workshop.name}.`);

  return lines.join("\n");
}

/** Builds a wa.me deep link. If no phone is on file, omits the number so
 * the share sheet still opens (user picks a contact themselves). */
export function buildWhatsappUrl(phone: string | null | undefined, message: string): string {
  const encoded = encodeURIComponent(message);
  const digitsOnly = phone?.replace(/[^\d]/g, "");
  const international = digitsOnly ? toInternationalPkNumber(digitsOnly) : null;
  return international ? `https://wa.me/${international}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * wa.me links require a full international number. Workshops in this
 * market almost always store numbers in local format (03XXXXXXXXX), so we
 * convert that specific, common case to +92XXXXXXXXXX. Numbers already in
 * international format (92... or longer) are passed through unchanged.
 */
function toInternationalPkNumber(digits: string): string {
  if (digits.startsWith("0") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}
