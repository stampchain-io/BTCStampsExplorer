/**
 * Lighthouse CI Configuration
 *
 * Performance budgets to prevent regressions like commit 663b5f66b
 *
 * Budget Thresholds:
 * - TBT (Total Blocking Time): < 500ms - CRITICAL metric for interactivity
 * - FCP (First Contentful Paint): < 2000ms - When user sees first content
 * - LCP (Largest Contentful Paint): < 2500ms - Largest element visible
 * - Speed Index: < 3500ms - How quickly content is visually displayed
 * - CLS (Cumulative Layout Shift): < 0.1 - Visual stability
 */

module.exports = {
  ci: {
    collect: {
      // Run against local dev server started by docker-compose.dev.yml
      url: [
        "http://localhost:8000/",
        "http://localhost:8000/stamp/1",
        "http://localhost:8000/src20",
      ],
      // Number of runs per URL for more stable results
      numberOfRuns: 3,
      settings: {
        // Preset for consistent testing
        preset: "desktop",
        // Additional Chrome flags for CI environment
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        // Skip certain audits not relevant for API/Explorer
        skipAudits: [
          "uses-http2",
          "uses-long-cache-ttl",
        ],
      },
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        // Performance budgets - CRITICAL thresholds
        "total-blocking-time": ["error", { maxNumericValue: 500 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "speed-index": ["error", { maxNumericValue: 3500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Additional Core Web Vitals
        "interactive": ["warn", { maxNumericValue: 3500 }],
        "max-potential-fid": ["warn", { maxNumericValue: 130 }],

        // Performance score threshold
        "categories:performance": ["warn", { minScore: 0.9 }],

        // Relax some non-performance assertions for API/Explorer use case
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      // Upload to temporary public storage
      target: "temporary-public-storage",
      // Keep reports for 30 days
      // githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN, // Optional: for GitHub status checks
    },
  },
};
