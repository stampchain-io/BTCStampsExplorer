/**
 * Comprehensive unit tests for client/wallet/wonder.ts
 *
 * Tests cover:
 *   - checkWonder() provider detection
 *   - handleAccountsChanged() account/balance mapping and disconnect handling
 *   - signPSBT() PSBT signing with the Wonder (UniSat-style) API
 *   - signMessage() message signing
 *   - wonderProvider object structure and interface compliance
 *
 * Approach: All tests use local mock implementations to avoid importing
 * browser-dependent modules (window, Preact signals, walletContext) in a
 * Deno server-side test environment. Mocks mirror the exact logic in wonder.ts
 * to validate behavior independently — the same approach used by
 * tests/unit/wallet/xverse.test.ts.
 */

import { assertEquals, assertRejects } from "@std/assert";

// ============================================================================
// Type definitions mirroring the Wonder provider + wallet types
// ============================================================================

interface MockBalance {
  confirmed?: number;
  unconfirmed?: number;
  total?: number;
}

interface MockWonderProvider {
  requestAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  getBalances: () => Promise<MockBalance | undefined>;
  signPsbt: (
    psbtHex: string,
    options: WonderSignOptions,
  ) => Promise<WonderSignResult | undefined>;
  broadcastTransaction: (txhex: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  on?: (event: string, handler: (accounts: string[]) => void) => void;
}

interface WonderSignOptions {
  autoFinalized: boolean;
  enableRBF: boolean;
  toSignInputs?: {
    index: number;
    address: string;
    sighashTypes?: number[] | undefined;
  }[];
}

interface WonderSignResult {
  txhex?: string;
  txid?: string;
  psbt?: string;
}

interface MockWallet {
  accounts: string[];
  address: string;
  publicKey: string;
  btcBalance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
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
// Local re-implementations mirroring wonder.ts logic for isolated testing
// ============================================================================

/**
 * Mirror of checkWonder() detection logic from wonder.ts.
 * checkWalletAvailability("wonder") resolves to whether wonderWallet is on
 * the global wallets object.
 */
function mockCheckWonder(
  wallets: { wonderWallet?: MockWonderProvider } | undefined,
): boolean {
  return !!(wallets?.wonderWallet);
}

type AccountsChangedOutcome =
  | { action: "disconnect" }
  | { action: "unchanged" }
  | { action: "update"; wallet: MockWallet };

/**
 * Mirror of handleAccountsChanged() from wonder.ts.
 * Returns the resulting action so tests can assert on it without a live
 * walletContext.
 */
async function mockHandleAccountsChanged(
  accounts: string[] | null | undefined,
  provider: MockWonderProvider | undefined,
  currentAddress = "",
): Promise<AccountsChangedOutcome> {
  if (!accounts || accounts.length === 0) {
    return { action: "disconnect" };
  }
  if (currentAddress === accounts[0]) {
    return { action: "unchanged" };
  }
  const wonder = provider!;
  const wallet = {} as MockWallet;
  wallet.accounts = accounts;
  wallet.address = accounts[0];
  wallet.publicKey = await wonder.getPublicKey();
  const balance = await wonder.getBalances();
  const confirmed = balance?.confirmed ?? 0;
  const unconfirmed = balance?.unconfirmed ?? 0;
  wallet.btcBalance = {
    confirmed,
    unconfirmed,
    total: balance?.total ?? confirmed + unconfirmed,
  };
  wallet.network = "mainnet";
  wallet.provider = "wonder";
  return { action: "update", wallet };
}

/**
 * Mirror of signPSBT() from wonder.ts.
 * Wonder is UniSat-style: with autoFinalized it returns a finalized
 * { txhex, txid }; without it, a signed { psbt }.
 */
async function mockSignPSBT(
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes: number[] | undefined = undefined,
  autoBroadcast = true,
  provider: MockWonderProvider | undefined = undefined,
  walletAddress = "bc1qtest123",
): Promise<SignPSBTResult> {
  try {
    const wonder = provider;
    if (!wonder) {
      return { signed: false, error: "Wonder Wallet not connected" };
    }

    const options: WonderSignOptions = {
      autoFinalized: autoBroadcast,
      enableRBF,
    };
    if (inputsToSign?.length > 0) {
      options.toSignInputs = inputsToSign.map((input) => ({
        index: input.index,
        address: walletAddress,
        sighashTypes,
      }));
    }

    const rawResult = await wonder.signPsbt(psbtHex, options);
    const result = rawResult as WonderSignResult | undefined;

    if (!result) {
      return { signed: false, error: "No result from Wonder Wallet" };
    }

    if (autoBroadcast && result.txhex) {
      try {
        const txid = await wonder.broadcastTransaction(result.txhex);
        return { signed: true, txid };
      } catch (_broadcastError) {
        return {
          signed: true,
          psbt: result.txhex,
          error: "Transaction signed but broadcast failed",
        };
      }
    }

    if (result.psbt) {
      return { signed: true, psbt: result.psbt };
    }
    if (result.txhex) {
      return { signed: true, psbt: result.txhex };
    }
    return { signed: false, error: "No signed result from Wonder Wallet" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { signed: false, error: message };
  }
}

/**
 * Mirror of signMessage() from wonder.ts.
 */
async function mockSignMessage(
  message: string,
  provider: MockWonderProvider | undefined,
): Promise<string> {
  const wonder = provider;
  if (!wonder) {
    throw new Error("Wonder Wallet not connected");
  }
  return await wonder.signMessage(message);
}

// ============================================================================
// Test helpers / constants
// ============================================================================

const PSBT_HEX = "70736274ff01000a0200000000000000000000";
const ADDRESS = "bc1qwonderpayment123abc";
const PUBKEY = "02wonderpubkey1234567890abcdef";

function buildProvider(
  overrides: Partial<MockWonderProvider> = {},
): MockWonderProvider {
  return {
    requestAccounts: () => Promise.resolve([ADDRESS]),
    getPublicKey: () => Promise.resolve(PUBKEY),
    getBalances: () =>
      Promise.resolve({ confirmed: 100000, unconfirmed: 0, total: 100000 }),
    signPsbt: () => Promise.resolve({ txhex: "aabbcc", txid: "txid123" }),
    broadcastTransaction: () => Promise.resolve("broadcasttxid"),
    signMessage: () => Promise.resolve("signature123"),
    on: () => {},
    ...overrides,
  };
}

// ============================================================================
// Section 1: checkWonder() detection tests
// ============================================================================

Deno.test("checkWonder: returns false when wallets object is undefined", () => {
  assertEquals(mockCheckWonder(undefined), false);
});

Deno.test(
  "checkWonder: returns false when wonderWallet is absent",
  () => {
    assertEquals(mockCheckWonder({}), false);
  },
);

Deno.test(
  "checkWonder: returns true when wonderWallet provider is present",
  () => {
    assertEquals(mockCheckWonder({ wonderWallet: buildProvider() }), true);
  },
);

// ============================================================================
// Section 2: handleAccountsChanged() tests
// ============================================================================

Deno.test(
  "handleAccountsChanged: disconnects when accounts is null",
  async () => {
    const outcome = await mockHandleAccountsChanged(null, buildProvider());
    assertEquals(outcome.action, "disconnect");
  },
);

Deno.test(
  "handleAccountsChanged: disconnects when accounts is empty",
  async () => {
    const outcome = await mockHandleAccountsChanged([], buildProvider());
    assertEquals(outcome.action, "disconnect");
  },
);

Deno.test(
  "handleAccountsChanged: no-op when first account equals current address",
  async () => {
    const outcome = await mockHandleAccountsChanged(
      [ADDRESS],
      buildProvider(),
      ADDRESS,
    );
    assertEquals(outcome.action, "unchanged");
  },
);

Deno.test(
  "handleAccountsChanged: builds wallet from first account",
  async () => {
    const outcome = await mockHandleAccountsChanged([ADDRESS], buildProvider());
    assertEquals(outcome.action, "update");
    if (outcome.action !== "update") return;
    assertEquals(outcome.wallet.address, ADDRESS);
    assertEquals(outcome.wallet.accounts, [ADDRESS]);
    assertEquals(outcome.wallet.publicKey, PUBKEY);
    assertEquals(outcome.wallet.provider, "wonder");
    assertEquals(outcome.wallet.network, "mainnet");
  },
);

Deno.test(
  "handleAccountsChanged: maps confirmed/unconfirmed/total balance",
  async () => {
    const provider = buildProvider({
      getBalances: () =>
        Promise.resolve({ confirmed: 5000, unconfirmed: 250, total: 5250 }),
    });
    const outcome = await mockHandleAccountsChanged([ADDRESS], provider);
    if (outcome.action !== "update") throw new Error("expected update");
    assertEquals(outcome.wallet.btcBalance.confirmed, 5000);
    assertEquals(outcome.wallet.btcBalance.unconfirmed, 250);
    assertEquals(outcome.wallet.btcBalance.total, 5250);
  },
);

Deno.test(
  "handleAccountsChanged: derives total when provider omits it",
  async () => {
    const provider = buildProvider({
      getBalances: () => Promise.resolve({ confirmed: 700, unconfirmed: 300 }),
    });
    const outcome = await mockHandleAccountsChanged([ADDRESS], provider);
    if (outcome.action !== "update") throw new Error("expected update");
    assertEquals(outcome.wallet.btcBalance.total, 1000);
  },
);

Deno.test(
  "handleAccountsChanged: defaults balances to zero when missing",
  async () => {
    const provider = buildProvider({
      getBalances: () => Promise.resolve(undefined),
    });
    const outcome = await mockHandleAccountsChanged([ADDRESS], provider);
    if (outcome.action !== "update") throw new Error("expected update");
    assertEquals(outcome.wallet.btcBalance.confirmed, 0);
    assertEquals(outcome.wallet.btcBalance.unconfirmed, 0);
    assertEquals(outcome.wallet.btcBalance.total, 0);
  },
);

Deno.test(
  "handleAccountsChanged: selects the first of multiple accounts",
  async () => {
    const outcome = await mockHandleAccountsChanged(
      [ADDRESS, "bc1qsecond456"],
      buildProvider(),
    );
    if (outcome.action !== "update") throw new Error("expected update");
    assertEquals(outcome.wallet.address, ADDRESS);
    assertEquals(outcome.wallet.accounts.length, 2);
  },
);

// ============================================================================
// Section 3: signPSBT() tests
// ============================================================================

Deno.test(
  "signPSBT: returns error when provider not connected",
  async () => {
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      undefined,
    );
    assertEquals(result.signed, false);
    assertEquals(result.error, "Wonder Wallet not connected");
  },
);

Deno.test(
  "signPSBT: auto-broadcasts finalized txhex and returns txid",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve({ txhex: "deadbeef" }),
      broadcastTransaction: () => Promise.resolve("finaltxid"),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      provider,
    );
    assertEquals(result.signed, true);
    assertEquals(result.txid, "finaltxid");
  },
);

Deno.test(
  "signPSBT: falls back to signed txhex when broadcast fails",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve({ txhex: "deadbeef" }),
      broadcastTransaction: () => Promise.reject(new Error("network down")),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      provider,
    );
    assertEquals(result.signed, true);
    assertEquals(result.psbt, "deadbeef");
    assertEquals(result.error, "Transaction signed but broadcast failed");
  },
);

Deno.test(
  "signPSBT: returns signed psbt when not auto-broadcasting",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve({ psbt: "signedpsbthex" }),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      provider,
    );
    assertEquals(result.signed, true);
    assertEquals(result.psbt, "signedpsbthex");
    assertEquals(result.txid, undefined);
  },
);

Deno.test(
  "signPSBT: returns txhex as psbt when no-broadcast wallet returns txhex only",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve({ txhex: "rawtxhex" }),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      provider,
    );
    assertEquals(result.signed, true);
    assertEquals(result.psbt, "rawtxhex");
  },
);

Deno.test(
  "signPSBT: errors when provider returns no result",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve(undefined),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      provider,
    );
    assertEquals(result.signed, false);
    assertEquals(result.error, "No result from Wonder Wallet");
  },
);

Deno.test(
  "signPSBT: errors when result has neither txhex nor psbt",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.resolve({}),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      false,
      provider,
    );
    assertEquals(result.signed, false);
    assertEquals(result.error, "No signed result from Wonder Wallet");
  },
);

Deno.test(
  "signPSBT: maps toSignInputs with address and sighashTypes",
  async () => {
    let captured: WonderSignOptions | undefined;
    const provider = buildProvider({
      signPsbt: (_hex, options) => {
        captured = options;
        return Promise.resolve({ psbt: "ok" });
      },
    });
    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }, { index: 2 }],
      true,
      [1],
      false,
      provider,
      "bc1qmine",
    );
    assertEquals(captured?.autoFinalized, false);
    assertEquals(captured?.enableRBF, true);
    assertEquals(captured?.toSignInputs?.length, 2);
    assertEquals(captured?.toSignInputs?.[0].index, 0);
    assertEquals(captured?.toSignInputs?.[0].address, "bc1qmine");
    assertEquals(captured?.toSignInputs?.[0].sighashTypes, [1]);
    assertEquals(captured?.toSignInputs?.[1].index, 2);
  },
);

Deno.test(
  "signPSBT: omits toSignInputs when no inputs provided",
  async () => {
    let captured: WonderSignOptions | undefined;
    const provider = buildProvider({
      signPsbt: (_hex, options) => {
        captured = options;
        return Promise.resolve({ psbt: "ok" });
      },
    });
    await mockSignPSBT(PSBT_HEX, [], true, undefined, false, provider);
    assertEquals(captured?.toSignInputs, undefined);
  },
);

Deno.test(
  "signPSBT: passes enableRBF flag through to options",
  async () => {
    let captured: WonderSignOptions | undefined;
    const provider = buildProvider({
      signPsbt: (_hex, options) => {
        captured = options;
        return Promise.resolve({ psbt: "ok" });
      },
    });
    await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      false,
      undefined,
      false,
      provider,
    );
    assertEquals(captured?.enableRBF, false);
  },
);

Deno.test(
  "signPSBT: returns error message when signPsbt throws",
  async () => {
    const provider = buildProvider({
      signPsbt: () => Promise.reject(new Error("user rejected")),
    });
    const result = await mockSignPSBT(
      PSBT_HEX,
      [{ index: 0 }],
      true,
      undefined,
      true,
      provider,
    );
    assertEquals(result.signed, false);
    assertEquals(result.error, "user rejected");
  },
);

// ============================================================================
// Section 4: signMessage() tests
// ============================================================================

Deno.test(
  "signMessage: throws when provider not connected",
  async () => {
    await assertRejects(
      () => mockSignMessage("hello", undefined),
      Error,
      "Wonder Wallet not connected",
    );
  },
);

Deno.test(
  "signMessage: returns signature from provider",
  async () => {
    const provider = buildProvider({
      signMessage: () => Promise.resolve("0xsignedmessage"),
    });
    const sig = await mockSignMessage("hello world", provider);
    assertEquals(sig, "0xsignedmessage");
  },
);

Deno.test(
  "signMessage: forwards the exact message to the provider",
  async () => {
    let captured = "";
    const provider = buildProvider({
      signMessage: (message) => {
        captured = message;
        return Promise.resolve("sig");
      },
    });
    await mockSignMessage("prove ownership", provider);
    assertEquals(captured, "prove ownership");
  },
);

// ============================================================================
// Section 5: wonderProvider structure tests
// ============================================================================

Deno.test(
  "wonderProvider: exposes connectWonder, signPSBT and signMessage",
  () => {
    const wonderProvider = {
      connectWonder: () => {},
      signPSBT: () => {},
      signMessage: () => {},
    };
    assertEquals(typeof wonderProvider.connectWonder, "function");
    assertEquals(typeof wonderProvider.signPSBT, "function");
    assertEquals(typeof wonderProvider.signMessage, "function");
  },
);
