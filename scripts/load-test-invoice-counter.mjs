// Load test for the atomic invoice numbering scheme (models/Counter.ts).
//
// What this proves: under real concurrency, two mechanics generating
// invoices for two different jobs at the same instant can never receive
// the same invoice number. That's the one place a race condition would
// actually cost someone money, so it's worth verifying against a real
// MongoDB instance rather than trusting the code by inspection alone.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node scripts/load-test-invoice-counter.mjs [concurrency]
//
// Defaults to 200 concurrent requests if no concurrency argument is given.
// Uses a throwaway workshopId — this does NOT touch any real workshop data,
// and cleans up after itself.

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const CONCURRENCY = Number(process.argv[2]) || 200;

if (!MONGODB_URI) {
  console.error("Set MONGODB_URI before running this script.");
  process.exit(1);
}

// Mirrors the exact logic in models/Counter.ts's getNextInvoiceNumber —
// kept in sync manually since this script runs standalone, outside the
// Next.js/TypeScript build. If you change the increment logic there,
// update it here too.
async function getNextInvoiceNumber(counters, workshopId, prefix) {
  const result = await counters.findOneAndUpdate(
    { _id: workshopId },
    { $inc: { invoiceSeq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const doc = result.value ?? result;
  const padded = String(doc.invoiceSeq).padStart(4, "0");
  return `${prefix}-${padded}`;
}

async function main() {
  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const counters = db.collection("counters");

  const workshopId = new ObjectId(); // throwaway id, isolated from real data

  console.log(`Firing ${CONCURRENCY} concurrent invoice-number requests for a throwaway workshop...`);
  const start = Date.now();

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => getNextInvoiceNumber(counters, workshopId, "INV"))
  );

  const elapsedMs = Date.now() - start;

  const unique = new Set(results);
  const duplicates = results.length - unique.size;

  console.log(`\nCompleted ${results.length} requests in ${elapsedMs}ms.`);
  console.log(`Unique invoice numbers: ${unique.size}`);
  console.log(`Duplicates: ${duplicates}`);

  // Clean up the throwaway counter document so this script leaves no trace.
  await counters.deleteOne({ _id: workshopId });
  await client.close();

  if (duplicates > 0) {
    console.error(`\n❌ FAILED — the invoice counter produced duplicate numbers under concurrency.`);
    process.exit(1);
  }

  console.log(`\n✅ PASSED — no duplicate invoice numbers under ${CONCURRENCY}-way concurrency.`);
}

main().catch((err) => {
  console.error("Load test crashed:", err);
  process.exit(1);
});
