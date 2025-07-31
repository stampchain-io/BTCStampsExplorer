/**
 * @fileoverview Tests for SRC-101 Protocol Type Definitions
 *
 * This test file validates the type correctness and relationships of all
 * SRC-101 NFT protocol types to ensure type safety and proper structure.
 *
 * @version 1.0.0
 */

import { assert } from "jsr:@std/assert@1";
import type {
  // Legacy compatibility types
  Deployment,
  // Response types
  PaginatedSrc101ResponseBody,
  // Data types
  SRC101Balance,
  Src101BalanceParams,
  Src101Detail,
  SRC101InputData,
  // Core protocol types
  SRC101Operation,
  SRC101OwnerParams,
  // Request parameter types
  SRC101TokenidsParams,
  SRC101TxParams,
  SRC101ValidTxParams,
  SRC101ValidTxTotalCountParams,
  TokenidSrc101ResponseBody,
  TotalSrc101ResponseBody,
} from "./src101.d.ts";

Deno.test("SRC-101 Type Definitions", async (t) => {
  await t.step(
    "SRC101Operation type should include all valid operations",
    () => {
      const validOps: SRC101Operation[] = [
        "deploy",
        "mint",
        "transfer",
        "setrecord",
        "renew",
      ];

      // Test type assignment
      const deploy: SRC101Operation = "deploy";
      const mint: SRC101Operation = "mint";
      const transfer: SRC101Operation = "transfer";
      const setrecord: SRC101Operation = "setrecord";
      const renew: SRC101Operation = "renew";

      assert(validOps.includes(deploy));
      assert(validOps.includes(mint));
      assert(validOps.includes(transfer));
      assert(validOps.includes(setrecord));
      assert(validOps.includes(renew));
    },
  );

  await t.step(
    "SRC101InputData should have required and optional fields",
    () => {
      // Test minimal required fields
      const minimalInput: SRC101InputData = {
        op: "deploy",
        sourceAddress: "bc1q123...",
        changeAddress: "bc1q456...",
        feeRate: 10,
      };

      assert(minimalInput.op === "deploy");
      assert(minimalInput.sourceAddress === "bc1q123...");
      assert(minimalInput.changeAddress === "bc1q456...");
      assert(minimalInput.feeRate === 10);

      // Test with optional fields
      const completeInput: SRC101InputData = {
        op: "mint",
        sourceAddress: "bc1q123...",
        changeAddress: "bc1q456...",
        feeRate: 15,
        toAddress: "bc1q789...",
        name: "Test NFT",
        lim: 1000,
        tick: "TESTNFT",
        desc: "A test NFT collection",
        mintstart: 1640995200,
        mintend: 1672531200,
        web: "https://example.com",
        x: "@testnft",
      };

      assert(completeInput.name === "Test NFT");
      assert(completeInput.lim === 1000);
      assert(completeInput.tick === "TESTNFT");
      assert(completeInput.web === "https://example.com");
    },
  );

  await t.step("SRC101Balance should have correct structure", () => {
    const balance: SRC101Balance = {
      address: "bc1q123...",
      p: "SRC-101",
      deploy_hash: "abc123def456...",
      tokenid: "1",
      tokenid_utf8: "1",
      expire_timestamp: 1672531200,
      last_update: 1640995200,
      address_btc: "bc1q123...",
      address_eth: "0x123...",
      txt_data: "metadata",
      img: "https://example.com/image.png",
      owner: "bc1q123...",
    };

    assert(balance.p === "SRC-101");
    assert(balance.tokenid === "1");
    assert(typeof balance.expire_timestamp === "number");
    assert(typeof balance.last_update === "number");
  });

  await t.step("Src101Detail should handle nullable fields correctly", () => {
    const detail: Src101Detail = {
      tx_hash: "abc123...",
      block_index: 800000,
      p: "SRC-101",
      op: "deploy",
      tick: null,
      tick_hash: null,
      name: "Test Collection",
      tokenid: ["1", "2", "3"],
      tokenid_utf8: "1,2,3",
      description: "A test NFT collection",
      wla: null,
      imglp: "https://example.com/large.png",
      imgf: "https://example.com/image.png",
      deploy_hash: "deploy123...",
      creator: "bc1q123...",
      pri: 100,
      dua: null,
      lim: 1000,
      mintstart: 1640995200,
      mintend: 1672531200,
      owner: "bc1q123...",
      toaddress: null,
      destination: "bc1q456...",
      block_time: "2023-01-01T00:00:00Z",
    };

    assert(detail.tick === null);
    assert(detail.name === "Test Collection");
    assert(Array.isArray(detail.tokenid));
    assert(detail.tokenid?.length === 3);
    assert(detail.block_index === 800000);
  });

  await t.step("Request parameter types should support pagination", () => {
    const tokenidsParams: SRC101TokenidsParams = {
      deploy_hash: "abc123...",
      address_btc: "bc1q123...",
      prim: true,
      limit: 50,
      page: 1,
      sort: "desc",
    };

    const ownerParams: SRC101OwnerParams = {
      deploy_hash: "abc123...",
      tokenid: "1",
      limit: 25,
      page: 2,
    };

    const balanceParams: Src101BalanceParams = {
      address: "bc1q123...",
      limit: 100,
      page: 1,
      sort: "asc",
    };

    assert(tokenidsParams.limit === 50);
    assert(tokenidsParams.prim === true);
    assert(ownerParams.page === 2);
    assert(balanceParams.address === "bc1q123...");
  });

  await t.step("Response types should include pagination metadata", () => {
    const paginatedResponse: PaginatedSrc101ResponseBody = {
      last_block: 800000,
      page: 1,
      limit: 50,
      totalPages: 10,
      data: [
        {
          tx_hash: "abc123...",
          block_index: 799999,
          p: "SRC-101",
          op: "mint",
          tick: "TESTNFT",
          tick_hash: "tick123...",
          name: "Test NFT #1",
          tokenid: ["1"],
          tokenid_utf8: "1",
          description: "First test NFT",
          wla: null,
          imglp: "https://example.com/nft1_large.png",
          imgf: "https://example.com/nft1.png",
          deploy_hash: "deploy123...",
          creator: "bc1q123...",
          pri: 1,
          dua: null,
          lim: 1,
          mintstart: 1640995200,
          mintend: 1672531200,
          owner: "bc1q456...",
          toaddress: "bc1q456...",
          destination: "bc1q456...",
          block_time: "2023-01-01T00:00:00Z",
        },
      ],
    };

    const totalResponse: TotalSrc101ResponseBody = {
      last_block: 800000,
      data: 5000,
    };

    const tokenidResponse: TokenidSrc101ResponseBody = {
      last_block: 800000,
      page: 1,
      limit: 10,
      totalPages: 5,
      data: "1,2,3,4,5,6,7,8,9,10",
    };

    assert(paginatedResponse.data.length === 1);
    assert(paginatedResponse.totalPages === 10);
    assert(totalResponse.data === 5000);
    assert(typeof tokenidResponse.data === "string");
  });

  await t.step("Transaction parameter types should support filtering", () => {
    const txParams: SRC101TxParams = {
      tick: "TESTNFT",
      op: "mint",
      valid: 1, // Only valid transactions
      block_index: "800000",
      deploy_hash: "abc123...",
      limit: 100,
      page: 1,
    };

    const validTxParams: SRC101ValidTxParams = {
      tick: "TESTNFT",
      op: "transfer",
      deploy_hash: "abc123...",
      tx_hash: "tx123...",
      address: "bc1q123...",
      limit: 50,
    };

    assert(txParams.valid === 1);
    assert(txParams.op === "mint");
    assert(validTxParams.op === "transfer");
    assert(validTxParams.tx_hash === "tx123...");
  });

  await t.step("Legacy compatibility types should maintain structure", () => {
    const deployment: Deployment = {
      amt: 1000,
      block_index: 800000,
      block_time: "2023-01-01T00:00:00Z",
      creator: "bc1q123...",
      creator_name: "Test Creator",
      deci: 0,
      destination: "bc1q456...",
      lim: 1000,
      max: 10000,
      op: "deploy",
      p: "SRC-101",
      tick: "TESTNFT",
      tx_hash: "abc123...",
    };

    assert(deployment.amt === 1000);
    assert(deployment.p === "SRC-101");
  });

  await t.step("Type relationships should be properly maintained", () => {
    // Test that Src101Detail can be used in PaginatedSrc101ResponseBody
    const details: Src101Detail[] = [
      {
        tx_hash: "abc123...",
        block_index: 800000,
        p: "SRC-101",
        op: "deploy",
        tick: "TESTNFT",
        tick_hash: "tick123...",
        name: "Test Collection",
        tokenid: null,
        tokenid_utf8: null,
        description: "Test deployment",
        wla: null,
        imglp: null,
        imgf: null,
        deploy_hash: null,
        creator: "bc1q123...",
        pri: null,
        dua: null,
        lim: 1000,
        mintstart: 1640995200,
        mintend: 1672531200,
        owner: null,
        toaddress: null,
        destination: "bc1q456...",
        block_time: "2023-01-01T00:00:00Z",
      },
    ];

    const response: PaginatedSrc101ResponseBody = {
      last_block: 800000,
      page: 1,
      limit: 1,
      totalPages: 1,
      data: details,
    };

    assert(response.data[0].op === "deploy");
    assert(response.data[0].tick === "TESTNFT");
  });

  await t.step("Optional vs required fields should be properly typed", () => {
    // Test that required fields cannot be undefined
    const balance: SRC101Balance = {
      address: "bc1q123...",
      p: "SRC-101",
      deploy_hash: "abc123...",
      tokenid: "1",
      tokenid_utf8: "1",
      expire_timestamp: 1672531200,
      last_update: 1640995200,
      address_btc: "bc1q123...",
      address_eth: "0x123...",
      txt_data: "",
      img: "",
      owner: "bc1q123...",
    };

    // Test optional fields can be omitted
    const minimalParams: SRC101OwnerParams = {
      // All fields are optional
    };

    const partialParams: SRC101ValidTxTotalCountParams = {
      tick: "TESTNFT",
      // Other fields are optional
    };

    assert(balance.address === "bc1q123...");
    assert(typeof minimalParams === "object");
    assert(partialParams.tick === "TESTNFT");
  });
});
