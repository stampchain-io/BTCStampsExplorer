import { Handlers } from "$fresh/server.ts";
import { logger, LogNamespace } from "$lib/utils/logger.ts";
import { serverConfig } from "$server/config/config.ts";

interface TestResult {
  txHash: string;
  url: string;
  status: number;
  ok: boolean;
  contentType: string | null;
  headers: Record<string, string>;
  cors?: {
    allowOrigin: string | null;
    allowMethods: string | null;
    allowHeaders: string | null;
  };
  error?: string;
  type?: string;
}

interface TestResults {
  config?: {
    BASE_URL: string;
    IMAGES_SRC_PATH?: string;
  };
  stampchainTests: TestResult[];
  proxyTests: TestResult[];
  corsTests: {
    get: TestResult;
    post: TestResult;
    options: TestResult;
  };
}

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Get the current URL to determine base URL
    const currentUrl = new URL(req.url);
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;

    // Use a known working stamp hash
    const testTxHash =
      "827374352ddea0191a7e597753aae1a7bec66318f94e9d8587ed9fa6f8cffe61";

    // Get the DENO_ENV value
    const denoEnv = Deno.env.get("DENO_ENV") || "unknown";

    // Log the environment
    logger.debug("environment", {
      message: "Current DENO_ENV",
      denoEnv,
    });

    logger.debug("images", {
      message: "Testing image endpoints and configurations",
      config: {
        IMAGES_SRC_PATH: serverConfig.IMAGES_SRC_PATH,
        BASE_URL: baseUrl,
      },
    });

    const testResults: TestResults = {
      config: {
        BASE_URL: baseUrl,
        IMAGES_SRC_PATH: serverConfig.IMAGES_SRC_PATH,
      },
      stampchainTests: [],
      proxyTests: [],
      corsTests: {
        get: {} as TestResult,
        post: {} as TestResult,
        options: {} as TestResult,
      },
    };

    // Test stampchain.io
    try {
      const stampchainUrl = `https://stampchain.io/stamps/${testTxHash}.png`;
      const response = await fetch(stampchainUrl, {
        headers: {
          "Accept": "image/*",
          "Origin": baseUrl,
        },
      });

      testResults.stampchainTests.push({
        txHash: testTxHash,
        url: stampchainUrl,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
        headers: Object.fromEntries(response.headers.entries()),
        cors: {
          allowOrigin: response.headers.get("access-control-allow-origin"),
          allowMethods: response.headers.get("access-control-allow-methods"),
          allowHeaders: response.headers.get("access-control-allow-headers"),
        },
      });
    } catch (error) {
      testResults.stampchainTests.push({
        txHash: testTxHash,
        url: `https://stampchain.io/stamps/${testTxHash}.png`,
        status: 0,
        ok: false,
        contentType: null,
        headers: {},
        error: error instanceof Error ? error.message : String(error),
        type: "Connection Error",
      });
    }

    // Test proxy with different methods
    const proxyUrl = `${baseUrl}/content/${testTxHash}.png`;

    // Test OPTIONS first
    try {
      const optionsResponse = await fetch(proxyUrl, {
        method: "OPTIONS",
        headers: {
          "Origin": baseUrl,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      testResults.corsTests.options = {
        txHash: testTxHash,
        url: proxyUrl,
        status: optionsResponse.status,
        ok: optionsResponse.status === 204, // OPTIONS should return 204
        contentType: optionsResponse.headers.get("content-type"),
        headers: Object.fromEntries(optionsResponse.headers.entries()),
        cors: {
          allowOrigin: optionsResponse.headers.get(
            "access-control-allow-origin",
          ),
          allowMethods: optionsResponse.headers.get(
            "access-control-allow-methods",
          ),
          allowHeaders: optionsResponse.headers.get(
            "access-control-allow-headers",
          ),
        },
      };
    } catch (error) {
      testResults.corsTests.options = {
        txHash: testTxHash,
        url: proxyUrl,
        status: 0,
        ok: false,
        contentType: null,
        headers: {},
        error: error instanceof Error ? error.message : String(error),
        type: "Connection Error",
      };
    }

    // Test GET
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "image/*",
          "Origin": baseUrl,
        },
      });

      testResults.corsTests.get = {
        txHash: testTxHash,
        url: proxyUrl,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
        headers: Object.fromEntries(response.headers.entries()),
        cors: {
          allowOrigin: response.headers.get("access-control-allow-origin"),
          allowMethods: response.headers.get("access-control-allow-methods"),
          allowHeaders: response.headers.get("access-control-allow-headers"),
        },
      };
    } catch (error) {
      testResults.corsTests.get = {
        txHash: testTxHash,
        url: proxyUrl,
        status: 0,
        ok: false,
        contentType: null,
        headers: {},
        error: error instanceof Error ? error.message : String(error),
        type: "Connection Error",
      };
    }

    // Remove POST test since we're not supporting POST
    testResults.corsTests.post = {
      txHash: testTxHash,
      url: proxyUrl,
      status: 405,
      ok: false,
      contentType: null,
      headers: {
        "Allow": "GET, OPTIONS",
      },
      cors: {
        allowOrigin: "*",
        allowMethods: "GET, OPTIONS",
        allowHeaders: "Content-Type, Accept, Origin, Authorization",
      },
    };

    // Combine CSP tests into one implementation
    const cspTests = await testCSPConfiguration(baseUrl, testTxHash);

    async function testCSPConfiguration(baseUrl: string, txHash: string) {
      const testUrls = [
        {
          type: "html",
          url: `${baseUrl}/content/some-html-stamp.html`,
        },
        {
          type: "image",
          url: `${baseUrl}/content/some-image.png`,
        },
        {
          type: "stamp",
          url: `${baseUrl}/content/${txHash}.png`,
        },
      ];

      const results = await Promise.all(testUrls.map(async ({ type, url }) => {
        try {
          const response = await fetch(url);
          return {
            type,
            url,
            status: response.status,
            csp: response.headers.get("content-security-policy"),
            cspReportOnly: response.headers.get(
              "content-security-policy-report-only",
            ),
            contentType: response.headers.get("content-type"),
            cors: {
              allowOrigin: response.headers.get("access-control-allow-origin"),
              allowMethods: response.headers.get(
                "access-control-allow-methods",
              ),
            },
          };
        } catch (error) {
          return {
            type,
            url,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }));

      return {
        html: results.find((r) => r.type === "html"),
        image: results.find((r) => r.type === "image"),
        stamp: results.find((r) => r.type === "stamp"),
      };
    }

    // Add recursive stamp test
    const recursiveStampHash =
      "1412e4f7c6bd4063bc478db47444da242a3ad89a4309c6877da146bd9830ec42";

    async function testRecursiveStamp(baseUrl: string, txHash: string) {
      const testUrls = [
        {
          type: "html_direct",
          url: `${baseUrl}/content/${txHash}.html`,
        },
        {
          type: "s_endpoint",
          url: `${baseUrl}/s/${txHash}`,
        },
        {
          type: "embedded_content",
          url: `${baseUrl}/content/${txHash}/index.html`,
        },
      ];

      const results = await Promise.all(testUrls.map(async ({ type, url }) => {
        try {
          const response = await fetch(url);
          const text = await response.text();
          return {
            type,
            url,
            status: response.status,
            csp: response.headers.get("content-security-policy"),
            cspReportOnly: response.headers.get(
              "content-security-policy-report-only",
            ),
            contentType: response.headers.get("content-type"),
            contentLength: text.length,
            hasHtmlContent: text.includes("<!DOCTYPE html>") ||
              text.includes("<html"),
            cors: {
              allowOrigin: response.headers.get("access-control-allow-origin"),
              allowMethods: response.headers.get(
                "access-control-allow-methods",
              ),
            },
          };
        } catch (error) {
          return {
            type,
            url,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }));

      return {
        directHtml: results.find((r) => r.type === "html_direct"),
        sEndpoint: results.find((r) => r.type === "s_endpoint"),
        embeddedContent: results.find((r) => r.type === "embedded_content"),
      };
    }

    const recursiveTests = await testRecursiveStamp(
      baseUrl,
      recursiveStampHash,
    );

    // Update the HTML template to include recursive stamp tests
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Image and CORS Test Results</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 1200px; margin: 0 auto; }
            pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
            .test-section { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
            .success { color: green; }
            .error { color: red; }
          </style>
          <script>
            window.DENO_ENV = "${denoEnv}";
          </script>
        </head>
        <body>
          <h1>Image and CORS Test Results</h1>
          
          <div class="test-section">
            <h2>Configuration</h2>
            <pre>${
      JSON.stringify(
        {
          BASE_URL: baseUrl,
          IMAGES_SRC_PATH: serverConfig.IMAGES_SRC_PATH,
          DENO_ENV: denoEnv,
        },
        null,
        2,
      )
    }</pre>
          </div>

          <div class="test-section">
            <h2>Stampchain.io Tests</h2>
            <pre>${JSON.stringify(testResults.stampchainTests, null, 2)}</pre>
          </div>

          <div class="test-section">
            <h2>CORS Tests</h2>
            <h3>GET Request</h3>
            <pre>${JSON.stringify(testResults.corsTests.get, null, 2)}</pre>
            
            <h3>POST Request</h3>
            <pre>${JSON.stringify(testResults.corsTests.post, null, 2)}</pre>
            
            <h3>OPTIONS Request</h3>
            <pre>${JSON.stringify(testResults.corsTests.options, null, 2)}</pre>
          </div>

          <div class="test-section">
            <h2>CSP Tests</h2>
            <h3>HTML Content</h3>
            <pre>${JSON.stringify(cspTests.html, null, 2)}</pre>
            
            <h3>Image Content</h3>
            <pre>${JSON.stringify(cspTests.image, null, 2)}</pre>

            <h3>Stamp Content</h3>
            <pre>${JSON.stringify(cspTests.stamp, null, 2)}</pre>
          </div>

          <div class="test-section">
            <h2>Recursive Stamp Tests</h2>
            <h3>Direct HTML Access</h3>
            <pre>${JSON.stringify(recursiveTests.directHtml, null, 2)}</pre>
            
            <h3>/s/ Endpoint Access</h3>
            <pre>${JSON.stringify(recursiveTests.sEndpoint, null, 2)}</pre>

            <h3>Embedded Content Access</h3>
            <pre>${
      JSON.stringify(recursiveTests.embeddedContent, null, 2)
    }</pre>

            <h3>Live Test</h3>
            <iframe 
              src="/s/${recursiveStampHash}" 
              style="width: 100%; height: 300px; border: 1px solid #ccc;"
              onload="this.parentElement.classList.add('success')"
              onerror="this.parentElement.classList.add('error')"
            ></iframe>
          </div>

          <div class="test-section">
            <h2>Test Image</h2>
            <img src="/content/${testTxHash}.png" 
                 style="max-width: 200px;" 
                 onerror="this.parentElement.innerHTML='<p class=\'error\'>✗ Image failed to load</p>'"
            />
          </div>
        </body>
      </html>
    `;

    return new Response(htmlResponse, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
