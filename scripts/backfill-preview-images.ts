#!/usr/bin/env -S deno run --allow-all
/**
 * Backfill preview images to S3.
 *
 * Iterates through stamps in the database, renders previews for those
 * missing from S3, and uploads the PNGs.
 *
 * Usage:
 *   deno run --allow-all scripts/backfill-preview-images.ts [options]
 *
 * Options:
 *   --start=<n>       Start at stamp number (default: 0)
 *   --end=<n>         End at stamp number (default: latest)
 *   --concurrency=<n> Parallel renders (default: 5)
 *   --dry-run         Check which stamps are missing without uploading
 *   --force           Re-render even if S3 object exists
 */

import { parse } from "@std/flags";
import { StampController } from "$server/controller/stampController.ts";
import {
  getPreviewUrl,
  previewExists,
  uploadPreview,
} from "$server/services/aws/previewStorageService.ts";

// Dynamically import to trigger the env/config loading chain
await import("$/server/config/env.ts");

interface BackfillStats {
  total: number;
  skipped: number;
  uploaded: number;
  failed: number;
  alreadyExists: number;
}

const flags = parse(Deno.args, {
  default: {
    start: 0,
    concurrency: 5,
    "dry-run": false,
    force: false,
  },
  string: ["start", "end", "concurrency"],
  boolean: ["dry-run", "force"],
});

const startStamp = Number(flags.start) || 0;
const endStamp = flags.end ? Number(flags.end) : undefined;
const concurrency = Number(flags.concurrency) || 5;
const dryRun = flags["dry-run"];
const force = flags.force;

console.log("=== Preview Image Backfill ===");
console.log(`  Start: ${startStamp}`);
console.log(`  End: ${endStamp ?? "latest"}`);
console.log(`  Concurrency: ${concurrency}`);
console.log(`  Dry run: ${dryRun}`);
console.log(`  Force re-render: ${force}`);
console.log("");

// We need to import the renderPreview + helpers from preview.ts.
// Since they are not exported, we replicate the core logic here:
// fetch stamp data → check S3 → render via preview endpoint → upload.
// The simplest approach is to call the preview endpoint on the running server.

const BASE_URL = Deno.env.get("BACKFILL_BASE_URL") || "http://localhost:8000";

async function processStamp(
  identifier: string,
  stats: BackfillStats,
): Promise<void> {
  stats.total++;

  // Check if already in S3 (skip if not forcing)
  if (!force) {
    try {
      const exists = await previewExists(identifier);
      if (exists) {
        stats.alreadyExists++;
        return;
      }
    } catch {
      // S3 check failed — try to render anyway
    }
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would render and upload: ${identifier}`);
    return;
  }

  // Fetch rendered preview from the local server (it will render on cache miss)
  try {
    const resp = await fetch(
      `${BASE_URL}/api/v2/stamp/${identifier}/preview`,
      { redirect: "manual" },
    );

    // If server returns 302 to CloudFront URL → already handled by S3 path
    if (resp.status === 302) {
      const location = resp.headers.get("location") || "";
      if (location.includes("/stamps/previews/")) {
        stats.uploaded++;
        console.log(`  [OK] ${identifier} → ${location}`);
        return;
      }
    }

    // If server returns 200 with image → it's in redis mode, upload to S3 ourselves
    if (resp.status === 200) {
      const contentType = resp.headers.get("content-type");
      if (contentType?.includes("image/png")) {
        const pngBytes = new Uint8Array(await resp.arrayBuffer());
        const meta: Record<string, string> = {};
        for (const [k, v] of resp.headers.entries()) {
          if (k.startsWith("x-")) meta[k] = v;
        }
        await uploadPreview(identifier, pngBytes, meta);
        stats.uploaded++;
        console.log(
          `  [UPLOADED] ${identifier} → ${getPreviewUrl(identifier)}`,
        );
        return;
      }
    }

    // Fallback redirect or error
    stats.skipped++;
  } catch (err) {
    stats.failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [FAIL] ${identifier}: ${msg}`);
  }
}

async function runBatch(
  identifiers: string[],
  stats: BackfillStats,
): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < identifiers.length; i += concurrency) {
    chunks.push(identifiers.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map((id) => processStamp(id, stats)));

    if (stats.total % 50 === 0) {
      console.log(
        `  Progress: ${stats.total} processed, ${stats.uploaded} uploaded, ${stats.alreadyExists} existed, ${stats.failed} failed`,
      );
    }
  }
}

// Build stamp identifier list. Use numeric range.
const identifiers: string[] = [];
const upper = endStamp ?? startStamp + 1000;
for (let i = startStamp; i <= upper; i++) {
  identifiers.push(String(i));
}

const stats: BackfillStats = {
  total: 0,
  skipped: 0,
  uploaded: 0,
  failed: 0,
  alreadyExists: 0,
};

await runBatch(identifiers, stats);

console.log("");
console.log("=== Backfill Complete ===");
console.log(`  Total processed: ${stats.total}`);
console.log(`  Already in S3: ${stats.alreadyExists}`);
console.log(`  Newly uploaded: ${stats.uploaded}`);
console.log(`  Skipped (no preview): ${stats.skipped}`);
console.log(`  Failed: ${stats.failed}`);
