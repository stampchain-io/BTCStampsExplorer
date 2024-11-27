import { create, Header, verify } from "$djwt/mod.ts";
import { serverConfig } from "$server/config/config.ts";

interface CSRFPayload {
  exp: number;
}

export class SecurityService {
  private static SECRET_KEY: string | undefined;

  private static getSecretKey(): string {
    if (this.SECRET_KEY) return this.SECRET_KEY;

    const key = serverConfig.CSRF_SECRET_KEY;
    if (!key) {
      throw new Error("CSRF_SECRET_KEY is not set in the server configuration");
    }
    this.SECRET_KEY = key;
    return this.SECRET_KEY;
  }

  static async generateCSRFToken(): Promise<string> {
    const secretKey = this.getSecretKey();
    const encoder = new TextEncoder();
    const secretKeyUint8 = encoder.encode(secretKey);

    const header: Header = { alg: "HS256", typ: "JWT" };
    const payload: CSRFPayload = {
      exp: Math.floor((Date.now() + 3600000) / 1000), // 1 hour expiry
    };

    try {
      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyUint8,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );

      return await create(header, payload, key);
    } catch (error) {
      console.error("Error generating CSRF token:", error);
      throw new Error("Failed to generate CSRF token");
    }
  }

  static async validateCSRFToken(token: string): Promise<boolean> {
    const secretKey = this.getSecretKey();

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

      const verifiedToken = await verify(token, key);
      const payload = verifiedToken.payload as CSRFPayload;

      return Date.now() / 1000 <= payload.exp;
    } catch (error) {
      console.error("Error validating CSRF token:", error);
      return false;
    }
  }
} 