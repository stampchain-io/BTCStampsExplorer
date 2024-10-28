import { Foras, Memory, unzlib, zlib } from "compress";
import { arraysEqual } from "$lib/utils/binary/baseUtils.ts";

// Keep track of initialization state
let initialized = false;

export class SRC20CompressionService {
  // Keep original function names and signatures
  static async zLibCompress(data: Uint8Array): Promise<Uint8Array> {
    try {
      await initializeForas();
    } catch {
      return data; // Return original data if initialization fails in debug mode
    }

    try {
      const mem = new Memory(data);
      const compressed = zlib(mem).copyAndDispose();
      return compressed;
    } catch {
      return data; // Return original data if compression fails
    }
  }

  static async zLibUncompress(data: Uint8Array): Promise<Uint8Array> {
    try {
      await initializeForas();
    } catch {
      return data; // Return original data if initialization fails
    }

    try {
      const comp_mem = new Memory(data);
      const uncompressed = unzlib(comp_mem).copyAndDispose();
      return uncompressed;
    } catch {
      return data; // Return original data if decompression fails
    }
  }

  static async compressWithCheck(
    data: Uint8Array,
  ): Promise<{ compressedData: Uint8Array; compressed: boolean }> {
    if (data.length > 32) {
      let compressed: Uint8Array;
      try {
        compressed = await this.zLibCompress(data);
      } catch {
        compressed = data;
      }

      if (compressed.length === 0) {
        return { compressedData: data, compressed: false };
      }

      let uncompressed: Uint8Array;
      try {
        uncompressed = await this.zLibUncompress(compressed);
      } catch {
        uncompressed = data;
      }

      if (!arraysEqual(uncompressed, data)) {
        return { compressedData: data, compressed: false };
      }

      if (compressed.length < data.length) {
        return { compressedData: compressed, compressed: true };
      } else {
        return { compressedData: data, compressed: false };
      }
    } else {
      return { compressedData: data, compressed: false };
    }
  }
}

// Keep the original initialization function
async function initializeForas() {
  if (!initialized) {
    try {
      await Foras.initBundledOnce();
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize Foras:", error);
      // Skip WebAssembly initialization
    }
  }
}

// Export the functions directly to maintain exact same usage
export const {
  zLibCompress,
  zLibUncompress,
  compressWithCheck,
} = SRC20CompressionService;
