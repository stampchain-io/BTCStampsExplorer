import {
  create,
  Header,
  Payload,
  verify,
} from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// Ensure this is set in your environment variables
const SECRET_KEY = Deno.env.get("CSRF_SECRET_KEY");

if (!SECRET_KEY) {
  throw new Error("CSRF_SECRET_KEY is not set in the environment variables");
}

export async function generateCSRFToken(): Promise<string> {
  const encoder = new TextEncoder();
  const secretKeyUint8 = encoder.encode(SECRET_KEY);

  const header: Header = { alg: "HS256", typ: "JWT" };
  const payload: Payload = { exp: Date.now() + 3600000 };

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
  try {
    const encoder = new TextEncoder();
    const secretKeyUint8 = encoder.encode(SECRET_KEY);
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyUint8,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    await verify(token, key);
    return true;
  } catch {
    return false;
  }
}
