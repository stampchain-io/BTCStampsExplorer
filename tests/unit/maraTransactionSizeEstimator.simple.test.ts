import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import {
  calculateCIP33ChunkCount,
} from "../../lib/utils/bitcoin/minting/maraTransactionSizeEstimator.ts";

describe("Simple MARA Test", () => {
  it("should calculate basic chunk count", () => {
    const result = calculateCIP33ChunkCount(32);
    assertEquals(result, 1);
  });
});