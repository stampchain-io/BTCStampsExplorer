import { assertEquals } from "@std/assert";
import { describe, it } from "jsr:@std/testing@1.0.14/bdd";

import {
  calculateCIP33ChunkCount,
} from "../../lib/utils/bitcoin/minting/maraTransactionSizeEstimator.ts";

describe("Simple MARA Test", () => {
  it("should calculate basic chunk count", () => {
    const result = calculateCIP33ChunkCount(32);
    assertEquals(result, 1);
  });
});