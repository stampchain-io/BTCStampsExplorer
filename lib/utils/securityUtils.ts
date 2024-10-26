import "$/server/config/env.ts";

import { create, Header, Payload, verify } from "$djwt/mod.ts";

let SECRET_KEY: string | undefined;

function getSecretKey(): string {
  const key = Deno.env.get("CSRF_SECRET_KEY");
  if (!key) {
    throw new Error("CSRF_SECRET_KEY is not set in the server configuration");
  }
  SECRET_KEY = key;
  return SECRET_KEY;
}

export async function generateCSRFToken(): Promise<string> {
  const secretKey = getSecretKey();

  const encoder = new TextEncoder();
  const secretKeyUint8 = encoder.encode(secretKey);

  const header: Header = { alg: "HS256", typ: "JWT" };
  const payload: Payload = { exp: (Date.now() + 3600000) / 1000 }; // JWT `exp` is in seconds

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyUint8,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const token = await create(header, payload, key);
    return token;
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    throw new Error("Failed to generate CSRF token");
  }
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const secretKey = getSecretKey();

  try {
    const encoder = new TextEncoder();
    const secretKeyUint8 = encoder.encode(secretKey);
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyUint8,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const { payload } = await verify(token, key);
    const exp = payload.exp as number;
    if (Date.now() / 1000 > exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
