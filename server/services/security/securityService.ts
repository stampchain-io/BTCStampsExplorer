import { create, Header, verify } from "djwt/mod.ts";
import { serverConfig } from "$server/config/config.ts";
import { logger } from "$lib/utils/logger.ts";

interface CSRFPayload {
  exp: number;
}

export class SecurityService {
  private static SECRET_KEY: string | undefined;

  private static getSecretKey(): string {
    if (this.SECRET_KEY) return this.SECRET_KEY;

    const key = serverConfig.CSRF_SECRET_KEY;
    if (!key) {
      logger.error("stamps", {
        message: "CSRF secret key not configured",
      });
      throw new Error("CSRF_SECRET_KEY is not set in the server configuration");
    }
    this.SECRET_KEY = key;
    return this.SECRET_KEY;
  }

  static async generateCSRFToken(): Promise<string> {
    try {
      const secretKey = this.getSecretKey();
      const encoder = new TextEncoder();
      const secretKeyUint8 = encoder.encode(secretKey);

      const header: Header = { alg: "HS256", typ: "JWT" };
      const payload: CSRFPayload = {
        exp: Math.floor((Date.now() + 3600000) / 1000), // 1 hour expiry
      };

      logger.debug("stamps", {
        message: "Generating CSRF token",
        expiryTime: payload.exp,
        currentTime: Math.floor(Date.now() / 1000),
        expiresIn: payload.exp - Math.floor(Date.now() / 1000),
      });

      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyUint8,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );

      const token = await create(header, payload, key);

      logger.debug("stamps", {
        message: "Generated CSRF token",
        tokenLength: token.length,
        tokenPreview: token.slice(0, 10) + "...",
      });

      return token;
    } catch (error) {
      logger.error("stamps", {
        message: "Error generating CSRF token",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  static async validateCSRFToken(token: string): Promise<boolean> {
    try {
      const secretKey = this.getSecretKey();
      
      logger.debug("stamps", {
        message: "Starting CSRF token validation",
        tokenLength: token.length,
        tokenPreview: token.slice(0, 10) + "...",
        hasSecretKey: !!secretKey,
      });

      const encoder = new TextEncoder();
      const secretKeyUint8 = encoder.encode(secretKey);
      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyUint8,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );

      // First verify the token signature
      const verifiedToken = await verify(token, key);
      
      logger.debug("stamps", {
        message: "Token verification details",
        hasVerifiedToken: !!verifiedToken,
        verifiedTokenType: typeof verifiedToken,
        verifiedTokenKeys: Object.keys(verifiedToken || {}),
      });

      // Parse the token manually to get the payload
      const [headerB64, payloadB64] = token.split('.');
      if (!payloadB64) {
        logger.error("stamps", {
          message: "Invalid token format",
          token: token.slice(0, 10) + "...",
        });
        return false;
      }

      // Decode the base64 payload
      const payloadStr = atob(payloadB64);
      const payload = JSON.parse(payloadStr) as CSRFPayload;

      logger.debug("stamps", {
        message: "Decoded payload",
        hasPayload: !!payload,
        payloadType: typeof payload,
        payloadKeys: Object.keys(payload || {}),
        exp: payload?.exp,
      });

      if (!payload || typeof payload.exp !== 'number') {
        logger.error("stamps", {
          message: "Invalid payload structure",
          payload: JSON.stringify(payload),
        });
        return false;
      }

      const currentTime = Date.now() / 1000;
      const isValid = currentTime <= payload.exp;
      
      logger.debug("stamps", {
        message: "CSRF token validation result",
        tokenLength: token.length,
        tokenPreview: token.slice(0, 10) + "...",
        isValid,
        currentTime,
        expiryTime: payload.exp,
        expiresIn: payload.exp - currentTime,
      });

      return isValid;
    } catch (error) {
      logger.error("stamps", {
        message: "Error validating CSRF token",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        tokenLength: token.length,
        tokenPreview: token.slice(0, 10) + "...",
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      return false;
    }
  }
} 