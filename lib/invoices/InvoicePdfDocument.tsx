import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

// @react-pdf/renderer ships its own Helvetica; we stick with the built-in
// fonts to avoid a network fetch for custom font files at render time.
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  primary: "#2563EB",
  accent: "#F97316",
  success: "#22C55E",
  danger: "#EF4444",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: COLORS.text, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 56, height: 56, marginBottom: 6, objectFit: "contain" },
  workshopName: { fontSize: 16, fontWeight: 700, color: COLORS.primary },
  mutedLine: { fontSize: 9, color: COLORS.muted, marginTop: 1 },
  invoiceMetaBox: { alignItems: "flex-end" },
  invoiceTitle: { fontSize: 14, fontWeight: 700 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 8, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 3 },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colSubtotal: { flex: 1.2, textAlign: "right" },
  totalsBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    alignItems: "flex-end",
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 2 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700, color: COLORS.primary },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qrImage: { width: 64, height: 64 },
  footerText: { fontSize: 8, color: COLORS.muted, maxWidth: 380 },
});

function statusColor(status: string) {
  if (status === "paid") return COLORS.success;
  if (status === "partial") return COLORS.accent;
  return COLORS.danger;
}

export function InvoicePdfDocument({
  invoiceNumber,
  issuedAt,
  snapshot,
  qrDataUrl,
}: {
  invoiceNumber: string;
  issuedAt: string;
  snapshot: InvoiceSnapshot;
  qrDataUrl: string;
}) {
  const { workshop, vehicle, customer, job } = snapshot;
  const currency = workshop.currency;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {workshop.logoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML img
              <Image src={workshop.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.workshopName}>{workshop.name}</Text>
            {workshop.address && <Text style={styles.mutedLine}>{workshop.address}</Text>}
            {workshop.phone && <Text style={styles.mutedLine}>{workshop.phone}</Text>}
          </View>
          <View style={styles.invoiceMetaBox}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.mutedLine}>#{invoiceNumber}</Text>
            <Text style={styles.mutedLine}>{new Date(issuedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={[styles.row, styles.section]}>
          <View>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <Text>{vehicle.regNumber}</Text>
            {(vehicle.brand || vehicle.model) && (
              <Text style={styles.mutedLine}>{[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}</Text>
            )}
          </View>
          {customer && (customer.name || customer.phone) && (
            <View>
              <Text style={styles.sectionTitle}>Customer</Text>
              {customer.name && <Text>{customer.name}</Text>}
              {customer.phone && <Text style={styles.mutedLine}>{customer.phone}</Text>}
            </View>
          )}
        </View>

        {job.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {job.services.map((s, i) => (
              <Text key={i} style={{ paddingVertical: 2 }}>
                {s.name}
              </Text>
            ))}
          </View>
        )}

        {job.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parts</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colName]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
              <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
            </View>
            {job.parts.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colName}>{p.name}</Text>
                <Text style={styles.colQty}>{p.quantity}</Text>
                <Text style={styles.colPrice}>{formatCurrency(p.unitPrice, currency)}</Text>
                <Text style={styles.colSubtotal}>{formatCurrency(p.subtotal, currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {job.labor.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Labor</Text>
            {job.labor.map((l, i) => (
              <View key={i} style={styles.row}>
                <Text>{l.name}</Text>
                <Text>{formatCurrency(l.amount, currency)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={{ color: COLORS.muted }}>Parts Total</Text>
            <Text>{formatCurrency(job.partsTotal, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={{ color: COLORS.muted }}>Labor Total</Text>
            <Text>{formatCurrency(job.laborTotal, currency)}</Text>
          </View>
          {job.discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={{ color: COLORS.muted }}>Discount</Text>
              <Text>-{formatCurrency(job.discount, currency)}</Text>
            </View>
          )}
          {workshop.taxEnabled && job.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={{ color: COLORS.muted }}>Tax ({workshop.taxPercent}%)</Text>
              <Text>{formatCurrency(job.taxAmount, currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(job.grandTotal, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={{ color: COLORS.muted }}>Paid</Text>
            <Text>{formatCurrency(job.paidAmount, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={{ fontWeight: 700 }}>Balance Remaining</Text>
            <Text style={{ fontWeight: 700, color: statusColor(job.paymentStatus) }}>
              {formatCurrency(job.balanceRemaining, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{workshop.receiptFooter}</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML img */}
          <Image src={qrDataUrl} style={styles.qrImage} />
        </View>
      </Page>
    </Document>
  );
}
