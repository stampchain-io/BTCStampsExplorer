import { SecurityService } from "./securityService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

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
    // Skip origin check in development
    if (Deno.env.get("DENO_ENV") === "development") {
      return null;
    }

    const origin = req.headers.get("Origin");
    const referer = req.headers.get("Referer");
    
    // Get allowed domains from config
    const allowedDomains = serverConfig.ALLOWED_DOMAINS?.split(',') || [];
    const mainDomain = serverConfig.APP_DOMAIN;

    if (!mainDomain && allowedDomains.length === 0) {
      console.error("No domains configured for origin checking");
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
      allowedDomains.some(domain => 
        origin?.includes(domain) ||
        referer?.includes(domain)
      )
    );
                       
    if (!isTrustedOrigin) {
      console.warn("Rejected request from origin:", origin, "referer:", referer);
      return ResponseUtil.badRequest("Invalid origin");
    }

    return null;
  }
} 