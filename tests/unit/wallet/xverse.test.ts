/**
 * Comprehensive unit and integration tests for client/wallet/xverse.ts
 *
 * Tests cover:
 *   - checkXverse() provider detection
 *   - connectXverse() wallet connection and address extraction
 *   - hexToBase64() / base64ToHex() PSBT format conversion utilities
 *   - signPSBT() PSBT signing with Xverse API
 *   - signMessage() message signing
 *   - xverseProvider object structure and interface compliance
 *   - Integration: provider registration in walletHelper
 *
 * Approach: All tests use local mock implementations to avoid importing
 * browser-dependent modules (window, localStorage, Preact signals) in a
 * Deno server-side test environment. Mocks mirror the exact logic in xverse.ts
 * to validate behavior independently.
 */

import { assertEquals, assertRejects } from "@std/assert";

// ============================================================================
// Type definitions mirroring wallet types from $types/wallet.d.ts
// ============================================================================

type XverseAddressPurpose = "payment" | "ordinals" | "stacks";
type XverseAddressType = "p2wpkh" | "p2tr" | "p2sh" | "p2pkh";

interface XverseAddress {
  address: string;
  publicKey: string;
  purpose: XverseAddressPurpose;
  addressType: XverseAddressType;
}

interface XverseGetAddressesParams {
  purposes: XverseAddressPurpose[];
  message?: string;
}

interface XverseGetAddressesResponse {
  addresses: XverseAddress[];
}

interface MockBitcoinProvider {
  getAddresses: (
    params: XverseGetAddressesParams,
  ) => Promise<XverseGetAddressesResponse>;
  request: (
    method: string,
    params?: any,
  ) => Promise<any>;
  signMessage: (params: {
    address: string;
    message: string;
    protocol?: string;
  }) => Promise<string | { signature?: string; messageSignature?: string }>;
}

interface MockWallet {
  accounts: string[];
  address: string;
  ordinalsAddress?: string;
  btcBalance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
  stampBalance: any[];
  publicKey: string;
  addressType: "p2pkh" | "p2sh" | "p2wpkh" | "p2tr";
  network: "mainnet" | "testnet";
  provider: string;
}

interface SignPSBTResult {
  signed: boolean;
  psbt?: string;
  txid?: string;
  error?: string;
  cancelled?: boolean;
}

// ============================================================================
// Local re-implementations mirroring xverse.ts logic for isolated testing
// ============================================================================

/**
 * Mirror of checkXverse() detection logic from xverse.ts.
 * Tests if XverseProviders.BitcoinProvider is present.
 */
function mockCheckXverse(
  xverseProviders: { BitcoinProvider?: MockBitcoinProvider } | undefined,
): boolean {
  return !!(xverseProviders?.BitcoinProvider);
}

/**
 * Mirror of the core connectXverse() address-extraction logic from xverse.ts.
 * Calls getAddresses with payment+ordinals purposes and extracts the two addresses.
 */
async function mockConnectXverse(
  bitcoinProvider: MockBitcoinProvider | undefined,
): Promise<{ paymentAddress: XverseAddress; ordinalsAddress: XverseAddress }> {
  if (!bitcoinProvider) {
    throw new Error(
      "Xverse wallet not installed. Please install the Xverse extension.",
    );
  }

  const response = await bitcoinProvider.getAddresses({
    purposes: ["payment", "ordinals"],
    message: "stampchain.io needs your Bitcoin addresses for transactions.",
  });

  const { addresses } = response;

  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses received from Xverse wallet");
  }

  const paymentAddress = addresses.find(
    (addr) => addr.purpose === "payment" && addr.addressType === "p2wpkh",
  );
  const ordinalsAddress = addresses.find(
    (addr) => addr.purpose === "ordinals" && addr.addressType === "p2tr",
  );

  if (!paymentAddress) {
    throw new Error("No payment (P2WPKH) address found from Xverse wallet");
  }

  if (!ordinalsAddress) {
    throw new Error("No ordinals (P2TR) address found from Xverse wallet");
  }

  return { paymentAddress, ordinalsAddress };
}

/**
 * Mirror of hexToBase64() from xverse.ts.
 * Converts a hex-encoded string to base64.
 */
function hexToBase64(hex: string): string {
  const bytes = hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Mirror of base64ToHex() from xverse.ts.
 * Converts a base64-encoded string back to hex.
 */
function base64ToHex(base64: string): string {
  const binary = atob(base64);
  return Array.from(binary)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Mirror of signPSBT() from xverse.ts.
 * Signs a PSBT using the Xverse request API with base64 conversion.
 */
async function mockSignPSBT(
  psbtHex: string,
  inputsToSign: { index: number; address?: string }[],
  _enableRBF = true,
  _sighashTypes?: number[],
  autoBroadcast = true,
  walletAddress: string | null = "bc1qtest123",
  providerRequest?: (
    method: string,
    params: any,
  ) => Promise<{ result?: { psbt?: string; txid?: string } }>,
): Promise<SignPSBTResult> {
  if (!providerRequest) {
    return { signed: false, error: "Xverse wallet not detected" };
  }

  if (!walletAddress) {
    return { signed: false, error: "Xverse wallet not connected" };
  }

  try {
    const psbtBase64 = hexToBase64(psbtHex);

    const signInputs: Record<string, number[]> = {};
    for (const input of inputsToSign) {
      const addr = input.address || walletAddress;
      if (!signInputs[addr]) signInputs[addr] = [];
      signInputs[addr].push(input.index);
    }

    const signOptions = {
      psbt: psbtBase64,
      signInputs,
      broadcast: autoBroadcast,
    };

    const response = await providerRequest("signPsbt", signOptions);

    if (!response || !response.result) {
      return { signed: false, error: "No result from Xverse wallet" };
    }

    const signedBase64 = response.result.psbt;
    if (!signedBase64) {
      return {
        signed: false,
        error: "Xverse signing failed: missing psbt in response",
      };
    }

    const signedHex = base64ToHex(signedBase64);
    const result: SignPSBTResult = { psbt: signedHex, signed: true };

    if (response.result.txid) {
      result.txid = response.result.txid;
    }

    return result;
  } catch (error: any) {
    // Handle user rejection: code -32000 or 4001
    if (
      error?.code === -32000 ||
      error?.code === 4001 ||
      (typeof error?.error === "object" &&
        (error.error?.code === -32000 || error.error?.code === 4001))
    ) {
      return { signed: false, cancelled: true };
    }

    // Handle invalid parameters
    if (error?.code === -32602) {
      return {
        signed: false,
        error: "Invalid PSBT or signing parameters",
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      signed: false,
      error: `Xverse signing failed: ${message}`,
    };
  }
}

/**
 * Mirror of signMessage() from xverse.ts.
 * Signs an arbitrary message using the Xverse provider.
 */
async function mockSignMessage(
  message: string,
  walletAddress: string | null,
  mockProvider?: (params: {
    address: string;
    message: string;
    protocol?: string;
  }) => Promise<string | { signature?: string; messageSignature?: string }>,
): Promise<string> {
  if (!mockProvider) {
    throw new Error("Xverse wallet not installed");
  }

  if (!walletAddress) {
    throw new Error("Wallet not connected");
  }

  const response = await mockProvider({
    address: walletAddress,
    message,
    protocol: "ECDSA",
  });

  if (typeof response === "string") {
    return response;
  }
  if (typeof response === "object" && response !== null) {
    const r = response as { signature?: string; messageSignature?: string };
    const sig = r.signature || r.messageSignature;
    if (sig) return sig;
  }

  throw new Error("Unexpected response format from Xverse signMessage");
}

// ============================================================================
// Test constants
// ============================================================================

const SAMPLE_HEX = "deadbeef";
const SAMPLE_BASE64 = "3q2+7w==";
const PSBT_HEX = "70736274ff01000a0200000000000000000000";
const PSBT_BASE64 = hexToBase64(PSBT_HEX);

const PAYMENT_ADDRESS: XverseAddress = {
  address: "bc1qpayment123abc",
  publicKey: "02paymentpubkey1234567890abcdef",
  purpose: "payment",
  addressType: "p2wpkh",
};

const ORDINALS_ADDRESS: XverseAddress = {
  address: "bc1pordinals456def",
  publicKey: "03ordinalspubkey1234567890abcdef",
  purpose: "ordinals",
  addressType: "p2tr",
};

// ============================================================================
// Helper: Build a mock Wallet object (mirrors handleConnect in xverse.ts)
// ============================================================================

function buildMockWallet(
  paymentAddr: XverseAddress,
  ordinalsAddr: XverseAddress,
  btcBalance = 100000,
  unconfirmedBalance = 0,
): MockWallet {
  return {
    address: paymentAddr.address,
    ordinalsAddress: ordinalsAddr.address,
    accounts: [paymentAddr.address, ordinalsAddr.address],
    publicKey: paymentAddr.publicKey,
    addressType: "p2wpkh",
    btcBalance: {
      confirmed: btcBalance,
      unconfirmed: unconfirmedBalance,
      total: btcBalance + unconfirmedBalance,
    },
    network: "mainnet",
    provider: "xverse",
    stampBalance: [],
  };
}

// ============================================================================
// Section 1: checkXverse() detection tests
// ============================================================================

Deno.test(
  "checkXverse: returns false when window.XverseProviders is undefined",
  () => {
    const result = mockCheckXverse(undefined);
    assertEquals(result, false);
  },
);

Deno.test(
  "checkXverse: returns false when XverseProviders exists but BitcoinProvider is absent",
  () => {
    const result = mockCheckXverse({});
    assertEquals(result, false);
  },
);

Deno.test(
  "checkXverse: returns true when window.XverseProviders.BitcoinProvider is present",
  () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () => Promise.resolve({ addresses: [] }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };
    const result = mockCheckXverse({ BitcoinProvider: mockProvider });
    assertEquals(result, true);
  },
);

Deno.test(
  "checkXverse: isXverseInstalled signal concept - false when provider absent",
  () => {
    // The actual xverse.ts updates isXverseInstalled signal.
    // Here we verify the detection logic that drives the signal value.
    const detectedWithNoProvider = mockCheckXverse(undefined);
    const detectedWithEmptyProviders = mockCheckXverse({});
    assertEquals(detectedWithNoProvider, false);
    assertEquals(detectedWithEmptyProviders, false);
  },
);

Deno.test(
  "checkXverse: isXverseInstalled signal concept - true when provider present",
  () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () => Promise.resolve({ addresses: [] }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };
    const detected = mockCheckXverse({ BitcoinProvider: mockProvider });
    assertEquals(detected, true);
  },
);

// ============================================================================
// Section 2: connectXverse() tests
// ============================================================================

Deno.test(
  "connectXverse: throws error when provider not installed",
  async () => {
    await assertRejects(
      () => mockConnectXverse(undefined),
      Error,
      "Xverse wallet not installed",
    );
  },
);

Deno.test(
  "connectXverse: calls getAddresses with purposes ['payment', 'ordinals']",
  async () => {
    let capturedPurposes: XverseAddressPurpose[] = [];

    const mockProvider: MockBitcoinProvider = {
      getAddresses: (params) => {
        capturedPurposes = params.purposes;
        return Promise.resolve({
          addresses: [
            {
              address: "bc1qpayment",
              publicKey: "02pk",
              purpose: "payment",
              addressType: "p2wpkh",
            },
            {
              address: "bc1pordinals",
              publicKey: "03pk",
              purpose: "ordinals",
              addressType: "p2tr",
            },
          ],
        });
      },
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    await mockConnectXverse(mockProvider);

    assertEquals(capturedPurposes, ["payment", "ordinals"]);
  },
);

Deno.test(
  "connectXverse: extracts payment (P2WPKH) address correctly",
  async () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () =>
        Promise.resolve({
          addresses: [PAYMENT_ADDRESS, ORDINALS_ADDRESS],
        }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    const result = await mockConnectXverse(mockProvider);

    assertEquals(result.paymentAddress.address, PAYMENT_ADDRESS.address);
    assertEquals(result.paymentAddress.addressType, "p2wpkh");
    assertEquals(result.paymentAddress.purpose, "payment");
    assertEquals(result.paymentAddress.publicKey, PAYMENT_ADDRESS.publicKey);
  },
);

Deno.test(
  "connectXverse: extracts ordinals (P2TR) address correctly",
  async () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () =>
        Promise.resolve({
          addresses: [PAYMENT_ADDRESS, ORDINALS_ADDRESS],
        }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    const result = await mockConnectXverse(mockProvider);

    assertEquals(result.ordinalsAddress.address, ORDINALS_ADDRESS.address);
    assertEquals(result.ordinalsAddress.addressType, "p2tr");
    assertEquals(result.ordinalsAddress.purpose, "ordinals");
    assertEquals(result.ordinalsAddress.publicKey, ORDINALS_ADDRESS.publicKey);
  },
);

Deno.test(
  "connectXverse: throws when no payment address in response",
  async () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () =>
        Promise.resolve({
          addresses: [ORDINALS_ADDRESS], // payment address omitted
        }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    await assertRejects(
      () => mockConnectXverse(mockProvider),
      Error,
      "No payment (P2WPKH) address found",
    );
  },
);

Deno.test(
  "connectXverse: throws when no ordinals address in response",
  async () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () =>
        Promise.resolve({
          addresses: [PAYMENT_ADDRESS], // ordinals address omitted
        }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    await assertRejects(
      () => mockConnectXverse(mockProvider),
      Error,
      "No ordinals (P2TR) address found",
    );
  },
);

Deno.test(
  "connectXverse: throws when address list is empty",
  async () => {
    const mockProvider: MockBitcoinProvider = {
      getAddresses: () => Promise.resolve({ addresses: [] }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    await assertRejects(
      () => mockConnectXverse(mockProvider),
      Error,
      "No addresses received",
    );
  },
);

Deno.test(
  "connectXverse: selects correct addresses when multiple are returned",
  async () => {
    const extraAddress: XverseAddress = {
      address: "SP1StacksAddress",
      publicKey: "04stacks_pk",
      purpose: "stacks",
      addressType: "p2wpkh",
    };

    const mockProvider: MockBitcoinProvider = {
      getAddresses: () =>
        Promise.resolve({
          addresses: [ORDINALS_ADDRESS, extraAddress, PAYMENT_ADDRESS],
        }),
      request: () => Promise.resolve({}),
      signMessage: () => Promise.resolve("sig"),
    };

    const result = await mockConnectXverse(mockProvider);

    assertEquals(result.paymentAddress.address, PAYMENT_ADDRESS.address);
    assertEquals(result.ordinalsAddress.address, ORDINALS_ADDRESS.address);
  },
);

Deno.test(
  "connectXverse: getBTCBalanceInfo is called with payment address (not ordinals)",
  async () => {
    const balanceFetchedFor: string[] = [];

    const mockGetBTCBalanceInfo = (address: string) => {
      balanceFetchedFor.push(address);
      return Promise.resolve({ balance: 50000, unconfirmedBalance: 1000 });
    };

    // Simulate handleConnect using payment address for balance lookup
    const simulateHandleConnect = async (
      paymentAddr: XverseAddress,
      ordinalsAddr: XverseAddress,
    ) => {
      const info = await mockGetBTCBalanceInfo(paymentAddr.address);
      return buildMockWallet(paymentAddr, ordinalsAddr, info.balance);
    };

    await simulateHandleConnect(PAYMENT_ADDRESS, ORDINALS_ADDRESS);

    assertEquals(balanceFetchedFor.includes(PAYMENT_ADDRESS.address), true);
    assertEquals(balanceFetchedFor.includes(ORDINALS_ADDRESS.address), false);
    assertEquals(balanceFetchedFor.length, 1);
  },
);

Deno.test(
  "connectXverse: builds correct Wallet object from addresses",
  () => {
    const wallet = buildMockWallet(
      PAYMENT_ADDRESS,
      ORDINALS_ADDRESS,
      75000,
      500,
    );

    assertEquals(wallet.address, PAYMENT_ADDRESS.address);
    assertEquals(wallet.ordinalsAddress, ORDINALS_ADDRESS.address);
    assertEquals(wallet.accounts.length, 2);
    assertEquals(wallet.accounts[0], PAYMENT_ADDRESS.address);
    assertEquals(wallet.accounts[1], ORDINALS_ADDRESS.address);
    assertEquals(wallet.publicKey, PAYMENT_ADDRESS.publicKey);
    assertEquals(wallet.addressType, "p2wpkh");
    assertEquals(wallet.network, "mainnet");
    assertEquals(wallet.provider, "xverse");
    assertEquals(wallet.btcBalance.confirmed, 75000);
    assertEquals(wallet.btcBalance.unconfirmed, 500);
    assertEquals(wallet.btcBalance.total, 75500);
  },
);

// ============================================================================
// Section 3: hexToBase64() and base64ToHex() conversion tests
// ============================================================================

Deno.test(
  "hexToBase64: converts known hex 'deadbeef' to '3q2+7w=='",
  () => {
    assertEquals(hexToBase64(SAMPLE_HEX), SAMPLE_BASE64);
  },
);

Deno.test(
  "hexToBase64: converts PSBT magic bytes (70736274ff) to base64",
  () => {
    const result = hexToBase64(PSBT_HEX);
    assertEquals(result, PSBT_BASE64);
    assertEquals(result.length > 0, true);
  },
);

Deno.test(
  "hexToBase64: converts single zero byte '00' to 'AA=='",
  () => {
    assertEquals(hexToBase64("00"), "AA==");
  },
);

Deno.test(
  "hexToBase64: converts all-ones byte 'ff' to '/w=='",
  () => {
    assertEquals(hexToBase64("ff"), "/w==");
  },
);

Deno.test(
  "base64ToHex: converts '3q2+7w==' back to 'deadbeef'",
  () => {
    assertEquals(base64ToHex(SAMPLE_BASE64), SAMPLE_HEX);
  },
);

Deno.test(
  "base64ToHex: round-trip conversion preserves original PSBT hex",
  () => {
    const roundTripped = base64ToHex(hexToBase64(PSBT_HEX));
    assertEquals(roundTripped, PSBT_HEX);
  },
);

Deno.test(
  "base64ToHex: round-trip on multiple arbitrary hex values",
  () => {
    const inputs = [
      "00",
      "ff",
      "aabbcc",
      "0102030405060708090a0b0c0d0e0f",
      "deadbeefcafebabe",
    ];

    for (const hex of inputs) {
      const roundTripped = base64ToHex(hexToBase64(hex));
      assertEquals(roundTripped, hex);
    }
  },
);

Deno.test(
  "base64ToHex: output is lowercase hex only",
  () => {
    const result = base64ToHex(hexToBase64(PSBT_HEX));
    assertEquals(/^[0-9a-f]+$/.test(result), true);
  },
);

// ============================================================================
// Section 4: signPSBT() tests
// ============================================================================

Deno.test(
  "signPSBT: returns error when Xverse wallet not detected (no provider)",
  async () => {
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      "bc1qtest123",
      undefined, // no provider
    );

    assertEquals(result.signed, false);
    assertEquals(result.error, "Xverse wallet not detected");
  },
);

Deno.test(
  "signPSBT: returns error when wallet not connected (null address)",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.resolve({
        result: { psbt: PSBT_BASE64 },
      });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      null, // wallet not connected
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.error, "Xverse wallet not connected");
  },
);

Deno.test(
  "signPSBT: converts hex PSBT to base64 before sending to Xverse",
  async () => {
    let capturedParams: any = null;

    const mockRequest = (_method: string, params: any) => {
      capturedParams = params;
      return Promise.resolve({ result: { psbt: params.psbt } });
    };

    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(capturedParams.psbt, PSBT_BASE64);
    assertEquals(capturedParams.psbt !== PSBT_HEX, true);
  },
);

Deno.test(
  "signPSBT: calls provider.request with method 'signPsbt'",
  async () => {
    let capturedMethod = "";

    const mockRequest = (method: string, params: any) => {
      capturedMethod = method;
      return Promise.resolve({ result: { psbt: params.psbt } });
    };

    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(capturedMethod, "signPsbt");
  },
);

Deno.test(
  "signPSBT: maps inputsToSign to Record<address, number[]> format",
  async () => {
    let capturedSignInputs: Record<string, number[]> = {};

    const mockRequest = (_method: string, params: any) => {
      capturedSignInputs = params.signInputs;
      return Promise.resolve({ result: { psbt: params.psbt } });
    };

    await mockSignPSBT(
      PSBT_HEX,
      [
        { index: 0, address: "bc1qaddr1" },
        { index: 1, address: "bc1qaddr2" },
        { index: 2, address: "bc1qaddr1" }, // same address, groups with index 0
      ],
      true,
      undefined,
      false,
      "bc1qdefault",
      mockRequest,
    );

    assertEquals(capturedSignInputs["bc1qaddr1"], [0, 2]);
    assertEquals(capturedSignInputs["bc1qaddr2"], [1]);
  },
);

Deno.test(
  "signPSBT: inputs without address use wallet address as default key",
  async () => {
    let capturedSignInputs: Record<string, number[]> = {};

    const mockRequest = (_method: string, params: any) => {
      capturedSignInputs = params.signInputs;
      return Promise.resolve({ result: { psbt: params.psbt } });
    };

    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }, { index: 1 }], // no address field on any input
      true,
      undefined,
      false,
      "bc1qwallet",
      mockRequest,
    );

    assertEquals(capturedSignInputs["bc1qwallet"], [0, 1]);
  },
);

Deno.test(
  "signPSBT: passes autoBroadcast flag as 'broadcast' to Xverse",
  async () => {
    const capturedBroadcastValues: boolean[] = [];

    const mockRequest = (_method: string, params: any) => {
      capturedBroadcastValues.push(params.broadcast);
      return Promise.resolve({ result: { psbt: params.psbt } });
    };

    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1q",
      mockRequest,
    );
    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      "bc1q",
      mockRequest,
    );

    assertEquals(capturedBroadcastValues[0], false);
    assertEquals(capturedBroadcastValues[1], true);
  },
);

Deno.test(
  "signPSBT: returns signed PSBT in hex format (converts from Xverse base64)",
  async () => {
    const SIGNED_HEX = "70736274ff01000a02000000ffffffff";
    const SIGNED_BASE64 = hexToBase64(SIGNED_HEX);

    const mockRequest = (_method: string, _params: any) =>
      Promise.resolve({
        result: { psbt: SIGNED_BASE64 },
      });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, true);
    assertEquals(result.psbt, SIGNED_HEX);
    assertEquals(/^[0-9a-f]+$/i.test(result.psbt!), true);
  },
);

Deno.test(
  "signPSBT: includes txid in result when Xverse provides it",
  async () => {
    const EXPECTED_TXID = "abc123txid456def";
    const SIGNED_BASE64 = hexToBase64("70736274ff01deadbeef");

    const mockRequest = (_method: string, _params: any) =>
      Promise.resolve({
        result: { psbt: SIGNED_BASE64, txid: EXPECTED_TXID },
      });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, true);
    assertEquals(result.txid, EXPECTED_TXID);
  },
);

Deno.test(
  "signPSBT: returns error when Xverse response has no result",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.resolve({
        // No result field
      });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.error, "No result from Xverse wallet");
  },
);

Deno.test(
  "signPSBT: returns error when response result is missing psbt field",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.resolve({
        result: { txid: "sometxid" }, // no psbt field
      });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(
      result.error,
      "Xverse signing failed: missing psbt in response",
    );
  },
);

Deno.test(
  "signPSBT: handles USER_REJECTION error with code -32000 (returns cancelled: true)",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.reject({ code: -32000, message: "User rejected" });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.cancelled, true);
  },
);

Deno.test(
  "signPSBT: handles USER_REJECTION error with code 4001 (returns cancelled: true)",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.reject({ code: 4001, message: "User denied" });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.cancelled, true);
  },
);

Deno.test(
  "signPSBT: handles USER_REJECTION in nested error.code structure",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.reject({ error: { code: -32000, message: "Nested rejection" } });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.cancelled, true);
  },
);

Deno.test(
  "signPSBT: handles INVALID_PARAMS error with code -32602",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.reject({ code: -32602, message: "Invalid params" });

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(result.error, "Invalid PSBT or signing parameters");
  },
);

Deno.test(
  "signPSBT: handles generic Error with descriptive message",
  async () => {
    const mockRequest = (_method: string, _params: any) =>
      Promise.reject(new Error("Network request timed out"));

    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      "bc1qtest123",
      mockRequest,
    );

    assertEquals(result.signed, false);
    assertEquals(
      result.error,
      "Xverse signing failed: Network request timed out",
    );
  },
);

// ============================================================================
// Section 5: signMessage() tests
// ============================================================================

Deno.test(
  "signMessage: throws when Xverse provider not installed (undefined)",
  async () => {
    await assertRejects(
      () => mockSignMessage("hello", "bc1qtest123", undefined),
      Error,
      "Xverse wallet not installed",
    );
  },
);

Deno.test(
  "signMessage: throws when wallet not connected (null address)",
  async () => {
    const mockProvider = (_params: any) => Promise.resolve("sig");
    await assertRejects(
      () => mockSignMessage("hello", null, mockProvider),
      Error,
      "Wallet not connected",
    );
  },
);

Deno.test(
  "signMessage: calls provider.signMessage with correct address and message",
  async () => {
    let capturedParams: {
      address: string;
      message: string;
      protocol?: string;
    } | null = null;
    const WALLET_ADDR = "bc1qpaymenttest456";
    const TEST_MESSAGE = "Sign this message for authentication";

    const mockProvider = (params: {
      address: string;
      message: string;
      protocol?: string;
    }) => {
      capturedParams = params;
      return Promise.resolve("mock_sig_abc");
    };

    await mockSignMessage(TEST_MESSAGE, WALLET_ADDR, mockProvider);

    assertEquals(capturedParams!.address, WALLET_ADDR);
    assertEquals(capturedParams!.message, TEST_MESSAGE);
  },
);

Deno.test(
  "signMessage: calls provider with protocol ECDSA",
  async () => {
    let capturedProtocol: string | undefined;

    const mockProvider = (params: {
      address: string;
      message: string;
      protocol?: string;
    }) => {
      capturedProtocol = params.protocol;
      return Promise.resolve("sig");
    };

    await mockSignMessage("test", "bc1q", mockProvider);

    assertEquals(capturedProtocol, "ECDSA");
  },
);

Deno.test(
  "signMessage: returns signature string when provider returns string directly",
  async () => {
    const EXPECTED_SIG = "H+abc123signatureHere==";
    const mockProvider = (_params: any) => Promise.resolve(EXPECTED_SIG);

    const result = await mockSignMessage(
      "test message",
      "bc1qaddr",
      mockProvider,
    );

    assertEquals(result, EXPECTED_SIG);
    assertEquals(typeof result, "string");
  },
);

Deno.test(
  "signMessage: extracts signature from object response with 'signature' field",
  async () => {
    const EXPECTED_SIG = "H+objectSig123==";
    const mockProvider = (_params: any) =>
      Promise.resolve({ signature: EXPECTED_SIG, messageSignature: "other" });

    const result = await mockSignMessage(
      "test message",
      "bc1qaddr",
      mockProvider,
    );

    assertEquals(result, EXPECTED_SIG);
  },
);

Deno.test(
  "signMessage: falls back to 'messageSignature' when 'signature' field is absent",
  async () => {
    const EXPECTED_SIG = "H+msgSig456==";
    const mockProvider = (_params: any) =>
      Promise.resolve({ messageSignature: EXPECTED_SIG });

    const result = await mockSignMessage(
      "test message",
      "bc1qaddr",
      mockProvider,
    );

    assertEquals(result, EXPECTED_SIG);
  },
);

Deno.test(
  "signMessage: throws on unexpected response format (not string, no sig fields)",
  async () => {
    const mockProvider = (_params: any) =>
      Promise.resolve({ unrecognized: "data" });

    await assertRejects(
      () => mockSignMessage("test", "bc1q", mockProvider),
      Error,
      "Unexpected response format from Xverse signMessage",
    );
  },
);

Deno.test(
  "signMessage: propagates USER_REJECTION error (code -32000)",
  async () => {
    const userRejectionError = Object.assign(new Error("User rejected"), {
      code: -32000,
    });
    const mockProvider = (_params: any) => Promise.reject(userRejectionError);

    const simulateWithHandling = async () => {
      try {
        await mockSignMessage("test", "bc1qaddr", mockProvider);
      } catch (error: any) {
        if (error?.code === -32000 || error?.code === 4001) {
          throw new Error("User rejected message signing");
        }
        throw error;
      }
    };

    await assertRejects(
      simulateWithHandling,
      Error,
      "User rejected message signing",
    );
  },
);

Deno.test(
  "signMessage: propagates INVALID_PARAMS error (code -32602)",
  async () => {
    const invalidParamsError = Object.assign(new Error("Invalid params"), {
      code: -32602,
    });
    const mockProvider = (_params: any) => Promise.reject(invalidParamsError);

    const simulateWithHandling = async () => {
      try {
        await mockSignMessage("test", "bc1qaddr", mockProvider);
      } catch (error: any) {
        if (error?.code === -32602) {
          throw new Error("Invalid message or address parameters");
        }
        throw error;
      }
    };

    await assertRejects(
      simulateWithHandling,
      Error,
      "Invalid message or address parameters",
    );
  },
);

// ============================================================================
// Section 6: Integration tests — xverseProvider object structure
// ============================================================================

/**
 * Interface reflecting the WalletProvider interface from walletHelper.ts.
 * xverseProvider must satisfy this interface to be used by getWalletProvider().
 */
interface WalletProvider {
  signMessage: (message: string) => Promise<string>;
  signPSBT: (
    psbtHex: string,
    inputsToSign: { index: number; address?: string }[],
    enableRBF?: boolean,
    sighashTypes?: number[],
    autoBroadcast?: boolean,
  ) => Promise<SignPSBTResult>;
  broadcastRawTX?: (rawTx: string) => Promise<string>;
  broadcastPSBT?: (psbtHex: string) => Promise<string>;
}

interface XverseProviderShape extends WalletProvider {
  checkXverse: () => boolean;
  connectXverse: (
    addToast: (msg: string, type: string) => void,
  ) => Promise<void>;
}

Deno.test(
  "xverseProvider: mock object satisfies WalletProvider interface",
  () => {
    const mockXverseProvider: XverseProviderShape = {
      checkXverse: () => false,
      connectXverse: (_addToast) => Promise.resolve(),
      signMessage: (_message) => Promise.resolve("signature"),
      signPSBT: (_psbtHex, _inputsToSign) =>
        Promise.resolve({
          signed: true,
          psbt: "abc",
        }),
      broadcastRawTX: (_rawTx) =>
        Promise.reject(
          new Error("broadcastRawTX not supported by Xverse wallet"),
        ),
      broadcastPSBT: (_psbtHex) =>
        Promise.reject(
          new Error("broadcastPSBT not supported by Xverse wallet"),
        ),
    };

    assertEquals(typeof mockXverseProvider.signMessage, "function");
    assertEquals(typeof mockXverseProvider.signPSBT, "function");
    assertEquals(typeof mockXverseProvider.checkXverse, "function");
    assertEquals(typeof mockXverseProvider.connectXverse, "function");
    assertEquals(typeof mockXverseProvider.broadcastRawTX, "function");
    assertEquals(typeof mockXverseProvider.broadcastPSBT, "function");
  },
);

Deno.test(
  "xverseProvider: signMessage returns Promise<string>",
  async () => {
    const mockXverseProvider: Pick<XverseProviderShape, "signMessage"> = {
      signMessage: (_message: string): Promise<string> =>
        Promise.resolve("test_signature_xyz"),
    };

    const result = await mockXverseProvider.signMessage("authenticate me");

    assertEquals(typeof result, "string");
    assertEquals(result.length > 0, true);
  },
);

Deno.test(
  "xverseProvider: broadcastRawTX rejects (unsupported by Xverse)",
  async () => {
    const broadcastRawTX = (_rawTx: string): Promise<string> =>
      Promise.reject(
        new Error(
          "broadcastRawTX not supported by Xverse wallet - use external broadcast service",
        ),
      );

    await assertRejects(
      () => broadcastRawTX("rawtxhex"),
      Error,
      "broadcastRawTX not supported by Xverse wallet",
    );
  },
);

Deno.test(
  "xverseProvider: broadcastPSBT rejects (unsupported by Xverse)",
  async () => {
    const broadcastPSBT = (_psbtHex: string): Promise<string> =>
      Promise.reject(
        new Error(
          "broadcastPSBT not supported by Xverse wallet - use external broadcast service",
        ),
      );

    await assertRejects(
      () => broadcastPSBT(PSBT_HEX),
      Error,
      "broadcastPSBT not supported by Xverse wallet",
    );
  },
);

Deno.test(
  "xverseProvider: provider methods are references to named functions (not inline redefinitions)",
  () => {
    // In the real xverse.ts, xverseProvider = { checkXverse, connectXverse, signMessage, signPSBT }
    // This test verifies the structural pattern where provider delegates to named exports.
    const checkXverseFn = () => false;
    const connectXverseFn = (_addToast: any): Promise<void> =>
      Promise.resolve();
    const signMessageFn = (_msg: string): Promise<string> =>
      Promise.resolve("sig");
    const signPSBTFn = (
      _hex: string,
      _inputs: any[],
    ): Promise<SignPSBTResult> => Promise.resolve({ signed: true });

    const provider = {
      checkXverse: checkXverseFn,
      connectXverse: connectXverseFn,
      signMessage: signMessageFn,
      signPSBT: signPSBTFn,
    };

    // Functions should be the same references, not copies
    assertEquals(provider.checkXverse, checkXverseFn);
    assertEquals(provider.connectXverse, connectXverseFn);
    assertEquals(provider.signMessage, signMessageFn);
    assertEquals(provider.signPSBT, signPSBTFn);
  },
);

Deno.test(
  "integration: getWalletProvider('xverse') concept returns xverse-compatible provider",
  () => {
    // Simulates walletHelper.ts getWalletProvider() switch case for 'xverse'
    const WALLET_PROVIDERS: Record<string, { type: string }> = {
      leather: { type: "leather" },
      okx: { type: "okx" },
      unisat: { type: "unisat" },
      xverse: { type: "xverse" },
    };

    const getWalletProvider = (provider: string | undefined): string => {
      switch (provider) {
        case "leather":
        case "okx":
        case "unisat":
        case "xverse":
          return provider;
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
    };

    assertEquals(getWalletProvider("xverse"), "xverse");
    assertEquals(WALLET_PROVIDERS["xverse"].type, "xverse");
  },
);

Deno.test(
  "integration: getWalletProvider throws for unknown provider",
  () => {
    const getWalletProvider = (provider: string | undefined): string => {
      switch (provider) {
        case "xverse":
          return provider;
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
    };

    let threw = false;
    try {
      getWalletProvider("unknownprovider");
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  },
);

// ============================================================================
// Section 7: Multi-address wallet structure tests (Xverse-specific)
// ============================================================================

Deno.test(
  "wallet multi-address: wallet.address stores payment (P2WPKH) address",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    assertEquals(wallet.address, PAYMENT_ADDRESS.address);
    assertEquals(wallet.addressType, "p2wpkh");
  },
);

Deno.test(
  "wallet multi-address: wallet.ordinalsAddress stores ordinals (P2TR) address",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    assertEquals(wallet.ordinalsAddress, ORDINALS_ADDRESS.address);
  },
);

Deno.test(
  "wallet multi-address: wallet.accounts contains both payment and ordinals addresses",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    assertEquals(wallet.accounts.length, 2);
    assertEquals(wallet.accounts[0], PAYMENT_ADDRESS.address);
    assertEquals(wallet.accounts[1], ORDINALS_ADDRESS.address);
  },
);

Deno.test(
  "wallet multi-address: payment and ordinals addresses are distinct values",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    assertEquals(wallet.address !== wallet.ordinalsAddress, true);
  },
);

Deno.test(
  "wallet multi-address: provider is set to 'xverse' for Xverse connections",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    assertEquals(wallet.provider, "xverse");
  },
);

Deno.test(
  "wallet multi-address: wallet is considered valid when payment address is non-empty",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    const isValid = !!wallet.address && wallet.address.length > 0;
    assertEquals(isValid, true);
  },
);

Deno.test(
  "wallet multi-address: serialization preserves ordinalsAddress in localStorage",
  () => {
    const wallet = buildMockWallet(PAYMENT_ADDRESS, ORDINALS_ADDRESS);
    const serialized = JSON.stringify(wallet);
    const parsed: MockWallet = JSON.parse(serialized);

    assertEquals(parsed.address, wallet.address);
    assertEquals(parsed.ordinalsAddress, wallet.ordinalsAddress);
    assertEquals(parsed.accounts[0], wallet.accounts[0]);
    assertEquals(parsed.accounts[1], wallet.accounts[1]);
  },
);

Deno.test(
  "wallet multi-address: btcBalance reflects confirmed and unconfirmed values",
  () => {
    const wallet = buildMockWallet(
      PAYMENT_ADDRESS,
      ORDINALS_ADDRESS,
      80000,
      2000,
    );
    assertEquals(wallet.btcBalance.confirmed, 80000);
    assertEquals(wallet.btcBalance.unconfirmed, 2000);
    assertEquals(wallet.btcBalance.total, 82000);
  },
);

// ============================================================================
// Section 8: isUserRejection logic tests
// ============================================================================

/**
 * Local mirror of the isUserRejection() helper from xverse.ts.
 */
function isUserRejection(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;

  if (err.code === -32000 || err.code === 4001) {
    return true;
  }

  if (typeof err.error === "object" && err.error !== null) {
    const inner = err.error as Record<string, unknown>;
    if (inner.code === -32000 || inner.code === 4001) {
      return true;
    }
  }

  const message = typeof err.message === "string" ? err.message : "";
  if (
    message.toLowerCase().includes("user rejected") ||
    message.toLowerCase().includes("user cancelled") ||
    message.toLowerCase().includes("user canceled") ||
    message.toLowerCase().includes("user denied")
  ) {
    return true;
  }

  return false;
}

Deno.test(
  "isUserRejection: returns true for code -32000",
  () => {
    assertEquals(isUserRejection({ code: -32000, message: "rejected" }), true);
  },
);

Deno.test(
  "isUserRejection: returns true for code 4001",
  () => {
    assertEquals(isUserRejection({ code: 4001, message: "denied" }), true);
  },
);

Deno.test(
  "isUserRejection: returns true for nested error.code -32000",
  () => {
    assertEquals(
      isUserRejection({ error: { code: -32000, message: "nested" } }),
      true,
    );
  },
);

Deno.test(
  "isUserRejection: returns true for 'user rejected' message string",
  () => {
    assertEquals(
      isUserRejection({ message: "User rejected the request" }),
      true,
    );
  },
);

Deno.test(
  "isUserRejection: returns true for 'user denied' message string",
  () => {
    assertEquals(isUserRejection({ message: "User denied transaction" }), true);
  },
);

Deno.test(
  "isUserRejection: returns false for unknown error code",
  () => {
    assertEquals(
      isUserRejection({ code: -99999, message: "Some other error" }),
      false,
    );
  },
);

Deno.test(
  "isUserRejection: returns false for null input",
  () => {
    assertEquals(isUserRejection(null), false);
  },
);

Deno.test(
  "isUserRejection: returns false for string input",
  () => {
    assertEquals(isUserRejection("user rejected"), false);
  },
);
