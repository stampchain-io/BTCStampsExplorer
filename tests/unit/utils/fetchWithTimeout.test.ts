import { assert, assertEquals } from "@std/assert";
import { stub } from "@std/testing@1.0.14/mock";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  fetchWithTimeout,
  getBTCBalanceFromMempool,
} from "$lib/utils/mempool.ts";

// Regression coverage for #1198: the aggregate /api/v2/balance/{address} endpoint
// hung 20s+ because the BTC-balance providers issued fetch() with no timeout, so a
// slow upstream blocked the request indefinitely. fetchWithTimeout bounds each
// fetch, and the mempool provider no longer retries a timeout (which used to
// re-accumulate the delay).

Deno.test("fetchWithTimeout returns the response when fetch resolves", async () => {
  const okResp = new Response("ok", { status: 200 });
  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(okResp));
  try {
    const res = await fetchWithTimeout("https://example.com/", 1000);
    assertEquals(res.status, 200);
    assertEquals(fetchStub.calls.length, 1);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("fetchWithTimeout throws a TimeoutError when the upstream hangs", async () => {
  // Simulate a hung upstream: resolve/reject only when the abort signal fires.
  const fetchStub = stub(
    globalThis,
    "fetch",
    (_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      }),
  );
  try {
    let caught: unknown;
    try {
      await fetchWithTimeout("https://example.com/", 20); // 20ms deadline
    } catch (e) {
      caught = e;
    }
    assert(caught instanceof Error, "expected an Error to be thrown");
    assertEquals((caught as Error).name, "TimeoutError");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("fetchWithTimeout passes non-timeout errors through unchanged", async () => {
  const boom = new Error("network down");
  const fetchStub = stub(globalThis, "fetch", () => Promise.reject(boom));
  try {
    let caught: unknown;
    try {
      await fetchWithTimeout("https://example.com/", 1000);
    } catch (e) {
      caught = e;
    }
    assertEquals(caught, boom); // same error, not converted to TimeoutError
  } finally {
    fetchStub.restore();
  }
});

Deno.test("DEFAULT_FETCH_TIMEOUT_MS is a sane positive deadline", () => {
  assert(DEFAULT_FETCH_TIMEOUT_MS > 0 && DEFAULT_FETCH_TIMEOUT_MS <= 15000);
});

Deno.test("getBTCBalanceFromMempool returns null and does NOT retry on timeout", async () => {
  // An AbortError from fetch becomes a TimeoutError in fetchWithTimeout; the
  // mempool provider must fail fast (single call, no MAX_RETRIES re-accumulation).
  const abortErr = new Error("aborted");
  abortErr.name = "AbortError";
  const fetchStub = stub(globalThis, "fetch", () => Promise.reject(abortErr));
  try {
    const result = await getBTCBalanceFromMempool("bc1qexampleaddress");
    assertEquals(result, null);
    assertEquals(fetchStub.calls.length, 1); // exactly one attempt — no retry
  } finally {
    fetchStub.restore();
  }
});
