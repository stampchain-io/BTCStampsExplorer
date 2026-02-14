/* ===== CAROUSEL IDLE VALIDATION TESTS ===== */
/*
 * Tests for Carousel stamp validation deferral using requestIdleCallback.
 * Ensures validation work is spread across idle periods to reduce TBT.
 *
 * Tests use static source analysis and SSR rendering to verify the pattern
 * without requiring a DOM environment (compatible with Deno server runtime).
 */

import { assertEquals, assertExists } from "@std/assert";
import { renderToString } from "preact-render-to-string";
import CarouselGallery from "../../../islands/section/gallery/Carousel.tsx";
import type { StampRow } from "../../../lib/types/stamp.d.ts";

/* ===== PATH HELPERS ===== */
// Resolve paths relative to this test file so they work regardless of CWD
const CAROUSEL_SRC = new URL(
  "../../../islands/section/gallery/Carousel.tsx",
  import.meta.url,
).pathname;

/* ===== TEST FIXTURES ===== */

const mockStamps: StampRow[] = [
  {
    tx_hash: "test_hash_1",
    stamp: 1,
    stamp_url: "https://example.com/stamp1.png",
    stamp_mimetype: "image/png",
    creator: "bc1qtest1",
    creator_name: "Test Creator 1",
    supply: 1,
    divisible: false,
  },
  {
    tx_hash: "test_hash_2",
    stamp: 2,
    stamp_url: "https://example.com/stamp2.png",
    stamp_mimetype: "image/png",
    creator: "bc1qtest2",
    creator_name: "Test Creator 2",
    supply: 1,
    divisible: false,
  },
  {
    tx_hash: "test_hash_3",
    stamp: 3,
    stamp_mimetype: "text/html",
    creator: "bc1qtest3",
    creator_name: "Test Creator 3",
    supply: 1,
    divisible: false,
  },
] as StampRow[];

/* ===== TESTS ===== */

Deno.test({
  name: "Carousel - uses requestIdleCallback for validation batching",
  fn: () => {
    // Verify the component source uses requestIdleCallback for batched validation
    const componentSource = Deno.readTextFileSync(CAROUSEL_SRC);

    // Must use requestIdleCallback for deferred validation
    assertEquals(
      componentSource.includes("requestIdleCallback"),
      true,
      "Carousel must use requestIdleCallback for deferred validation",
    );

    // Must reference idle callback in context of stamp validation
    assertEquals(
      componentSource.includes("processBatch"),
      true,
      "Carousel must process stamps in batches via processBatch function",
    );
  },
});

Deno.test({
  name: "Carousel - processes stamps in batches of 5",
  fn: () => {
    const componentSource = Deno.readTextFileSync(CAROUSEL_SRC);

    // Must define a batch size for processing
    assertEquals(
      componentSource.includes("batchSize"),
      true,
      "Carousel must define a batchSize for batch processing",
    );

    // Verify batch size is 5 (the expected value for idle callback chunking)
    assertEquals(
      componentSource.includes("batchSize = 5"),
      true,
      "Carousel batch size should be 5 for optimal idle callback chunking",
    );

    // Must calculate total batches from stamp count
    assertEquals(
      componentSource.includes("totalBatches"),
      true,
      "Carousel must calculate totalBatches for batch iteration",
    );
  },
});

Deno.test({
  name:
    "Carousel - falls back to setTimeout when requestIdleCallback unavailable",
  fn: () => {
    const componentSource = Deno.readTextFileSync(CAROUSEL_SRC);

    // Must use setTimeout as fallback when requestIdleCallback is not available
    assertEquals(
      componentSource.includes("setTimeout"),
      true,
      "Carousel must fall back to setTimeout when requestIdleCallback is unavailable",
    );
  },
});

Deno.test({
  name: "Carousel - renders without crashing when stamps array is empty",
  fn: () => {
    // SSR render with empty stamps array should produce valid HTML
    const html = renderToString(<CarouselGallery carouselStamps={[]} />);

    assertExists(html);
    assertEquals(typeof html, "string");
    assertEquals(html.length > 0, true);
  },
});

Deno.test({
  name: "Carousel - renders with stamps data on SSR",
  fn: () => {
    // SSR render with mock stamps should produce valid HTML
    const html = renderToString(
      <CarouselGallery carouselStamps={mockStamps} />,
    );

    assertExists(html);
    assertEquals(typeof html, "string");
    assertEquals(html.length > 0, true);
  },
});

Deno.test({
  name: "Carousel - validates stamp content using getStampImageSrc",
  fn: () => {
    const componentSource = Deno.readTextFileSync(CAROUSEL_SRC);

    // Must use getStampImageSrc for proper URL resolution
    assertEquals(
      componentSource.includes("getStampImageSrc"),
      true,
      "Carousel must use getStampImageSrc for stamp URL resolution",
    );

    // Must handle HTML content type separately
    assertEquals(
      componentSource.includes("text/html"),
      true,
      "Carousel must handle text/html stamp content type",
    );

    // Must have placeholder fallback for missing images
    assertEquals(
      componentSource.includes("PlaceholderImage"),
      true,
      "Carousel must show PlaceholderImage for stamps without source",
    );
  },
});
