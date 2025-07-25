/**
 * @fileoverview Tests for CollectionController
 * Aims for high coverage with mocked dependencies and fixtures
 */

import { CollectionController } from "$server/controller/collectionController.ts";
import { StampService } from "$server/services/stampService.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

// Test fixtures
const mockCollectionData = {
  collection_id: "POSH",
  collection_name: "posh",
  collection_description: "Test Collection",
  creators: ["bc1qtest"],
  stamp_count: 100,
  total_editions: 100,
  stamps: [],
  img: "https://example.com/collection.png",
};

const mockStampData = [
  {
    tx_hash: "abc123",
    stamp_mimetype: "image/png",
    collection_id: "POSH",
    cpid: "A123456789012345678901234567890123456789",
    stamp_url: "https://example.com/stamp1.png",
    ident: "STAMP",
  },
  {
    tx_hash: "def456",
    stamp_mimetype: "image/jpeg",
    collection_id: "POSH",
    cpid: "B123456789012345678901234567890123456789",
    stamp_url: "https://example.com/stamp2.jpg",
    ident: "STAMP",
  },
  {
    tx_hash: "ghi789",
    stamp_mimetype: "image/gif",
    collection_id: "POSH",
    cpid: "C123456789012345678901234567890123456789",
    stamp_url: "https://example.com/stamp3.gif",
    ident: "STAMP",
  },
];

const mockPaginatedResponse = {
  data: [mockCollectionData],
  page: 1,
  limit: 50,
  totalPages: 1,
  total: 1,
  last_block: 820000,
};

// Mock the services
const originalGetCollectionDetails = CollectionService.getCollectionDetails;
const originalGetCollectionNames = CollectionService.getCollectionNames;
const originalGetStamps = StampService.getStamps;

describe("CollectionController", () => {
  beforeEach(() => {
    // Reset mocks before each test
  });

  afterEach(() => {
    // Restore original methods
    CollectionService.getCollectionDetails = originalGetCollectionDetails;
    CollectionService.getCollectionNames = originalGetCollectionNames;
    StampService.getStamps = originalGetStamps;
  });

  describe("getCollectionDetails", () => {
    it("should return collection details successfully", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);

      const result = await CollectionController.getCollectionDetails({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].collection_id, "POSH");
      assertEquals(result.data[0].collection_name, "posh");
      assertEquals(result.page, 1);
      assertEquals(result.total, 1);
    });

    it("should handle service errors gracefully", async () => {
      CollectionService.getCollectionDetails = () => {
        throw new Error("Database connection failed");
      };

      await assertRejects(
        () => CollectionController.getCollectionDetails({ page: 1, limit: 50 }),
        Error,
        "Database connection failed",
      );
    });

    it("should pass through query parameters", async () => {
      let capturedParams: any;
      CollectionService.getCollectionDetails = (params) => {
        capturedParams = params;
        return Promise.resolve(mockPaginatedResponse);
      };

      await CollectionController.getCollectionDetails({
        page: 2,
        limit: 25,
        creator: "bc1qtest",
        sortBy: "stamp_count_desc",
      });

      assertEquals(capturedParams.page, 2);
      assertEquals(capturedParams.limit, 25);
      assertEquals(capturedParams.creator, "bc1qtest");
      assertEquals(capturedParams.sortBy, "stamp_count_desc");
    });

    it("should handle empty results", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve({
          data: [],
          page: 1,
          limit: 50,
          totalPages: 0,
          total: 0,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionDetails({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 0);
      assertEquals(result.total, 0);
    });

    it("should handle pagination parameters", async () => {
      let capturedParams: any;
      CollectionService.getCollectionDetails = (params) => {
        capturedParams = params;
        return Promise.resolve({
          data: [],
          page: params.page || 1,
          limit: params.limit || 50,
          totalPages: 0,
          total: 0,
          last_block: 820000,
        });
      };

      await CollectionController.getCollectionDetails({
        page: 5,
        limit: 10,
      });

      assertEquals(capturedParams.page, 5);
      assertEquals(capturedParams.limit, 10);
    });
  });

  describe("getCollectionNames", () => {
    it("should return collection names successfully", async () => {
      const mockNamesResponse = {
        data: [mockCollectionData],
        page: 1,
        limit: 50,
        totalPages: 1,
        total: 1,
        last_block: 820000,
      };

      CollectionService.getCollectionNames = () =>
        Promise.resolve(mockNamesResponse);

      const result = await CollectionController.getCollectionNames({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].collection_id, "POSH");
      assertEquals(result.data[0].collection_name, "posh");
    });

    it("should handle service errors gracefully", async () => {
      CollectionService.getCollectionNames = () => {
        throw new Error("Service unavailable");
      };

      await assertRejects(
        () => CollectionController.getCollectionNames({ page: 1, limit: 50 }),
        Error,
        "Service unavailable",
      );
    });

    it("should pass query parameters correctly", async () => {
      let capturedParams: any;
      CollectionService.getCollectionNames = (params) => {
        capturedParams = params;
        return Promise.resolve({
          data: [],
          page: 1,
          limit: 50,
          totalPages: 0,
          total: 0,
          last_block: 820000,
        });
      };

      await CollectionController.getCollectionNames({
        page: 3,
        limit: 100,
        creator: "bc1qcreator",
      });

      assertEquals(capturedParams.page, 3);
      assertEquals(capturedParams.limit, 100);
      assertEquals(capturedParams.creator, "bc1qcreator");
    });
  });

  describe("getCollectionStamps", () => {
    it("should return collections with stamp images", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: mockStampData,
          total: 3,
          totalPages: 1,
          page: 1,
          limit: 36,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      assertExists(result.data[0].stamp_images);
      assertExists(result.data[0].first_stamp_image);
      assertEquals(result.data[0].collection_id, "POSH");
    });

    it("should handle empty collection results", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve({
          data: [],
          page: 1,
          limit: 50,
          totalPages: 0,
          total: 0,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 0);
      assertEquals(result.total, 0);
    });

    it("should pass through includeMarketData parameter", async () => {
      let capturedParams: any;
      CollectionService.getCollectionDetails = (params) => {
        capturedParams = params;
        return Promise.resolve(mockPaginatedResponse);
      };

      StampService.getStamps = () =>
        Promise.resolve({
          stamps: [],
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 0,
          last_block: 820000,
        });

      await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
        includeMarketData: false,
      });

      assertEquals(capturedParams.includeMarketData, false);
    });

    it("should group stamps by collection ID", async () => {
      const multiCollectionData = [
        { ...mockCollectionData, collection_id: "POSH" },
        {
          ...mockCollectionData,
          collection_id: "COOL",
          collection_name: "cool",
        },
      ];

      const multiStampData = [
        { ...mockStampData[0], collection_id: "POSH" },
        { ...mockStampData[1], collection_id: "COOL" },
        { ...mockStampData[2], collection_id: "POSH" },
      ];

      CollectionService.getCollectionDetails = () =>
        Promise.resolve({
          ...mockPaginatedResponse,
          data: multiCollectionData,
          total: 2,
        });

      StampService.getStamps = (params: any) => {
        // Return stamps filtered by collection ID
        const stamps = multiStampData.filter((s) =>
          s.collection_id === params.collectionId
        );
        return Promise.resolve({
          stamps,
          page: 1,
          limit: 12,
          totalPages: 1,
          total: stamps.length,
          last_block: 820000,
        });
      };

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 2);

      // Find POSH collection
      const poshCollection = result.data.find((c) =>
        c.collection_id === "POSH"
      );
      assertExists(poshCollection);
      assertEquals(poshCollection.stamp_images.length, 2);

      // Find COOL collection
      const coolCollection = result.data.find((c) =>
        c.collection_id === "COOL"
      );
      assertExists(coolCollection);
      assertEquals(coolCollection.stamp_images.length, 1);
    });

    it("should handle stamps without required fields", async () => {
      const invalidStampData = [
        { ...mockStampData[0], tx_hash: null }, // Missing tx_hash
        { ...mockStampData[1], stamp_mimetype: null }, // Missing mimetype
        mockStampData[0], // Valid stamp
      ];

      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: invalidStampData,
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 3,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      // Should only have 1 valid stamp image (invalid ones filtered out)
      assertEquals(result.data[0].stamp_images.length, 1);
    });

    it("should limit stamps per collection to 12", async () => {
      const manyStamps = Array.from({ length: 20 }, (_, i) => ({
        ...mockStampData[0],
        tx_hash: `hash${i}`,
        cpid: `STAMP${i}`,
        stamp_url: `https://example.com/stamp${i}.png`,
      }));

      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: manyStamps,
          page: 1,
          limit: 240, // 20 * 12
          totalPages: 1,
          total: 20,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      // Should be limited to 12 stamps
      assertEquals(result.data[0].stamp_images.length, 12);
    });

    it("should use second stamp as first_stamp_image when available", async () => {
      const twoStamps = [mockStampData[0], mockStampData[1]];

      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: twoStamps,
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 2,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      // Should use second stamp (index 1) as first_stamp_image
      assertEquals(
        result.data[0].first_stamp_image,
        result.data[0].stamp_images[1],
      );
    });

    it("should fallback to first stamp when only one available", async () => {
      const oneStamp = [mockStampData[0]];

      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: oneStamp,
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 1,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      // Should use first stamp when only one available
      assertEquals(
        result.data[0].first_stamp_image,
        result.data[0].stamp_images[0],
      );
    });

    it("should handle collections with no stamps", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: [],
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 0,
          last_block: 820000,
        });

      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].stamp_images.length, 0);
      assertEquals(result.data[0].first_stamp_image, null);
    });

    it("should handle invalid data structure from CollectionService", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve({
          data: "invalid" as any, // Should be array
          page: 1,
          limit: 50,
          totalPages: 1,
          total: 1,
          last_block: 820000,
        });

      await assertRejects(
        () => CollectionController.getCollectionStamps({ page: 1, limit: 50 }),
        Error,
      );
    });

    it("should handle invalid data structure from StampService", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () =>
        Promise.resolve({
          stamps: "invalid", // Should be array
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 0,
          last_block: 820000,
        });

      // Should not throw - errors are caught and logged
      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      // Verify collections are returned with empty stamp arrays
      assertEquals(result.data.length, 1);
      result.data.forEach((collection: any) => {
        assertEquals(collection.stamp_images, []);
        assertEquals(collection.first_stamp_image, null);
      });
    });

    it("should pass correct parameters to StampService", async () => {
      let capturedStampParams: any;

      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = (params: any) => {
        capturedStampParams = params;
        return Promise.resolve({
          stamps: [],
          page: 1,
          limit: 12,
          totalPages: 1,
          total: 0,
          last_block: 820000,
        });
      };

      await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      assertEquals(capturedStampParams.collectionId, "POSH");
      assertEquals(capturedStampParams.limit, 12);
      assertEquals(capturedStampParams.sortBy, "DESC");
      assertEquals(capturedStampParams.type, "stamps");
      assertEquals(capturedStampParams.includeSecondary, false);
      assertEquals(capturedStampParams.skipTotalCount, true);
    });

    it("should handle service errors in getCollectionStamps", async () => {
      CollectionService.getCollectionDetails = () => {
        throw new Error("Collection service error");
      };

      await assertRejects(
        () => CollectionController.getCollectionStamps({ page: 1, limit: 50 }),
        Error,
        "Collection service error",
      );
    });

    it("should handle error from StampService", async () => {
      CollectionService.getCollectionDetails = () =>
        Promise.resolve(mockPaginatedResponse);
      StampService.getStamps = () => {
        throw new Error("Stamp service error");
      };

      // Should not throw - errors are caught and logged for individual stamp fetches
      const result = await CollectionController.getCollectionStamps({
        page: 1,
        limit: 50,
      });

      // Verify collections are returned with empty stamp arrays
      assertEquals(result.data.length, 1);
      result.data.forEach((collection: any) => {
        assertEquals(collection.stamp_images, []);
        assertEquals(collection.first_stamp_image, null);
      });
    });
  });
});
