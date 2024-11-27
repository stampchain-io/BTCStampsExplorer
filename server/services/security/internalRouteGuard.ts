import { SecurityService } from "./securityService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { serverConfig } from "$server/config/config.ts";

export class InternalRouteGuard {
  // For routes that require CSRF
  static async requireCSRF(req: Request) {
    const csrfToken = req.headers.get("X-CSRF-Token");
    if (!csrfToken) {
      return ResponseUtil.badRequest("Missing CSRF token");
    }

    const isValid = await SecurityService.validateCSRFToken(csrfToken);
    if (!isValid) {
      return ResponseUtil.badRequest("Invalid CSRF token");
    }

    return null; // No error
  }

  // For routes that require wallet signature
  static async requireSignature(req: Request) {
    const { signature, message, address } = await req.json();
    if (!signature || !message || !address) {
      return ResponseUtil.badRequest("Missing signature data");
    }

    const isValid = SecurityService.verifySignature(message, signature, address);
    if (!isValid) {
      return ResponseUtil.badRequest("Invalid signature");
    }

    return null;
  }

  // For webhook routes
  static async requireAPIKey(req: Request) {
    const apiKey = req.headers.get("X-API-Key");
    const configApiKey = serverConfig.API_KEY;

    // Check if API key is not configured
    if (!configApiKey || configApiKey.trim() === '') {
      console.error("API_KEY is not properly configured in server settings");
      return ResponseUtil.internalError(
        "Configuration error",
        "Server API key is not properly configured"
      );
    }

    // Check if request API key is missing or empty
    if (!apiKey || apiKey.trim() === '') {
      return ResponseUtil.custom(
        { error: "Missing API key" },
        401,
        { "Cache-Control": "no-store" }
      );
    }

    // Compare API keys
    if (apiKey !== configApiKey) {
      return ResponseUtil.custom(
        { error: "Invalid API key" },
        401,
        { "Cache-Control": "no-store" }
      );
    }

    return null;
  }

  // For origin checking
  static async requireTrustedOrigin(req: Request) {
    const requestId = `origin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Checking trusted origin...`);

    // Skip origin check in development
    if (Deno.env.get("DENO_ENV") === "development") {
      console.log(`[${requestId}] Development environment - skipping origin check`);
      return null;
    }

    const origin = req.headers.get("Origin");
    const referer = req.headers.get("Referer");
    console.log(`[${requestId}] Headers - Origin: ${origin}, Referer: ${referer}`);
    
    // Get allowed domains from config
    const allowedDomains = serverConfig.ALLOWED_DOMAINS?.split(',') || [];
    const mainDomain = serverConfig.APP_DOMAIN;
    console.log(`[${requestId}] Config - Main domain: ${mainDomain}, Allowed domains:`, allowedDomains);

    if (!mainDomain && allowedDomains.length === 0) {
      console.error(`[${requestId}] No domains configured for origin checking`);
      return ResponseUtil.internalError(
        "Configuration error",
        "Domain configuration missing"
      );
    }

    // Check if request origin matches any allowed domain
    const isTrustedOrigin = (origin || referer) && (
      // Check main domain
      (mainDomain && (
        origin?.includes(mainDomain) ||
        referer?.includes(mainDomain)
      )) ||
      // Check additional allowed domains
      allowedDomains.some(domain => {
        const matches = origin?.includes(domain) || referer?.includes(domain);
        if (matches) {
          console.log(`[${requestId}] Matched allowed domain: ${domain}`);
        }
        return matches;
      })
    );
                       
    if (!isTrustedOrigin) {
      console.warn(`[${requestId}] Rejected untrusted request - Origin: ${origin}, Referer: ${referer}`);
      return ResponseUtil.badRequest("Invalid origin");
    }

    console.log(`[${requestId}] Origin check passed`);
    return null;
  }
} 