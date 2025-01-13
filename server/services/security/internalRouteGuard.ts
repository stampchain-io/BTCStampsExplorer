import { SecurityService } from "./securityService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { serverConfig } from "$server/config/config.ts";
import { logger } from "$lib/utils/logger.ts";

export class InternalRouteGuard {
  // For routes that require CSRF
  static async requireCSRF(req: Request) {
    const csrfToken = req.headers.get("X-CSRF-Token") || req.headers.get("x-csrf-token");
    
    logger.debug("stamps", {
      message: "CSRF check started",
      hasToken: !!csrfToken,
      tokenPreview: csrfToken ? csrfToken.slice(0, 10) + "..." : "none",
      headers: Object.fromEntries(req.headers.entries()),
    });

    if (!csrfToken) {
      logger.error("stamps", {
        message: "Missing CSRF token",
        headers: Object.fromEntries(req.headers.entries()),
      });
      return ResponseUtil.badRequest("Missing CSRF token");
    }

    try {
      const isValid = await SecurityService.validateCSRFToken(csrfToken);
      
      logger.debug("stamps", {
        message: "CSRF validation completed",
        isValid,
        tokenPreview: csrfToken.slice(0, 10) + "...",
      });

      if (!isValid) {
        logger.error("stamps", {
          message: "Invalid CSRF token",
          tokenPreview: csrfToken.slice(0, 10) + "...",
        });
        return ResponseUtil.badRequest("Invalid CSRF token");
      }
    } catch (error) {
      logger.error("stamps", {
        message: "CSRF validation error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return ResponseUtil.badRequest("CSRF validation failed");
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

  private static getRequestInfo(headers: Headers) {
    return {
      // Cloudflare specific
      cfRay: headers.get("CF-Ray"),
      cfConnectingIp: headers.get("CF-Connecting-IP"),
      cfIpCountry: headers.get("CF-IPCountry"),
      cfVisitor: headers.get("CF-Visitor"),
      // AWS CloudFront
      cloudFrontId: headers.get("X-Amz-Cf-Id"),
      awsRegion: headers.get("X-Amz-Cf-Pop"),
      awsTraceId: headers.get("x-amzn-trace-id"),
      // Common CDN/forwarded info
      xForwardedFor: headers.get("x-forwarded-for"),
      xForwardedPort: headers.get("x-forwarded-port"),
      xForwardedProto: headers.get("x-forwarded-proto"),
      xForwardedHost: headers.get("x-forwarded-host"),
      // CDN info
      cdnLoop: headers.get("cdn-loop"),
    };
  }

  private static isCloudflareRequest(headers: Headers): boolean {
    return !!(headers.get("CF-Ray") || headers.get("cdn-loop")?.includes("cloudflare"));
  }

  private static isCloudFrontRequest(headers: Headers): boolean {
    return !!(headers.get("X-Amz-Cf-Id"));
  }

  static async requireTrustedOrigin(req: Request) {
    const requestId = `origin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Checking trusted origin...`);

    // Skip origin check in development
    if (Deno.env.get("DENO_ENV") === "development") {
      console.log(`[${requestId}] Development environment - skipping origin check`);
      return null;
    }

    // Get standard headers
    const origin = req.headers.get("Origin");
    const referer = req.headers.get("Referer");
    const host = req.headers.get("host");
    const scheme = req.headers.get("x-forwarded-proto") || "https";

    // Get detailed request information
    const requestInfo = this.getRequestInfo(req.headers);
    
    // Log detailed request information
    console.log(`[${requestId}] Request details:`, {
      standard: { origin, referer, host, scheme },
      cloud: requestInfo,
      isCloudflare: this.isCloudflareRequest(req.headers),
      isCloudFront: this.isCloudFrontRequest(req.headers)
    });
    
    // Get allowed domains from config
    const allowedDomains = serverConfig.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
    const mainDomain = serverConfig.APP_DOMAIN;
    
    console.log(`[${requestId}] Config - Main domain: ${mainDomain}, Allowed domains:`, allowedDomains);

    if (!mainDomain && allowedDomains.length === 0) {
      console.error(`[${requestId}] No domains configured for origin checking`);
      return ResponseUtil.internalError(
        "Configuration error",
        "Domain configuration missing"
      );
    }

    // Function to check if a domain matches the pattern
    const isDomainMatch = (domain: string, pattern: string) => {
      if (!domain || !pattern) return false;
      
      domain = domain.toLowerCase();
      pattern = pattern.toLowerCase();
      
      if (pattern.startsWith('*.')) {
        const patternBase = pattern.slice(2); // Remove *. from start
        return domain === patternBase || domain.endsWith('.' + patternBase);
      }
      return domain === pattern;
    };

    // Build list of domains to check against
    const requestDomains = new Set([
      host,
      requestInfo.xForwardedHost,
      origin && new URL(origin).hostname,
      referer && new URL(referer).hostname,
    ].filter(Boolean) as string[]);

    // Add CDN domains if needed
    if (this.isCloudflareRequest(req.headers)) {
      allowedDomains.push(
        '*.cloudflare.com',
        'cloudflare.com'
      );
    }
    if (this.isCloudFrontRequest(req.headers)) {
      allowedDomains.push(
        '*.cloudfront.net',
        'cloudfront.net'
      );
    }

    // Check if any request domain matches allowed domains
    const isTrustedOrigin = Array.from(requestDomains).some(domain => {
      // Check main domain
      if (mainDomain && isDomainMatch(domain, mainDomain)) {
        console.log(`[${requestId}] Matched main domain: ${domain}`);
        return true;
      }
      
      // Check additional allowed domains
      return allowedDomains.some(allowed => {
        if (isDomainMatch(domain, allowed)) {
          console.log(`[${requestId}] Matched allowed domain: ${domain} with ${allowed}`);
          return true;
        }
        return false;
      });
    });

    // Special case: If no origin/referer, but host matches allowed domains
    if (!origin && !referer && host) {
      const isValidHost = isDomainMatch(host, mainDomain) || 
        allowedDomains.some(allowed => isDomainMatch(host, allowed));
      
      if (isValidHost) {
        console.log(`[${requestId}] Direct request with valid host: ${host}`);
        return null;
      }
    }

    if (!isTrustedOrigin) {
      console.warn(`[${requestId}] Rejected untrusted request - Domains:`, 
        Array.from(requestDomains), 
        `Host: ${host}`,
        `CDN Info: ${JSON.stringify({
          cloudflare: this.isCloudflareRequest(req.headers),
          cloudfront: this.isCloudFrontRequest(req.headers)
        })}`
      );
      return ResponseUtil.badRequest("Invalid origin");
    }

    console.log(`[${requestId}] Origin check passed`);
    return null;
  }
} 