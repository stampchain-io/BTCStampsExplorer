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
 *
 * Test data IDs must match scripts/test-seed-data.sql:
 * - test_stamp_id = 1384305
 * - test_block = 820000
 * - test_src20_tick = stamp
 * - test_address = bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4
 */

module.exports = {
  ci: {
    collect: {
      // Run against local dev server - IDs must match test-seed-data.sql
      url: [
        "http://localhost:8000/",
        "http://localhost:8000/stamp/1384305",
        "http://localhost:8000/src20",
        "http://localhost:8000/src20/stamp",
        "http://localhost:8000/block/820000",
        "http://localhost:8000/wallet/bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4",
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
        // Performance budgets - CRITICAL thresholds (error = blocks CI)
        "total-blocking-time": ["error", { maxNumericValue: 500 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "speed-index": ["error", { maxNumericValue: 3500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Additional Core Web Vitals
        "interactive": ["warn", { maxNumericValue: 3500 }],
        "max-potential-fid": ["warn", { maxNumericValue: 130 }],

        // Category score thresholds (warn only - don't block CI)
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.8 }],

        // Audits that produce NaN in CI (no valid score) - turn off
        "lcp-lazy-loaded": "off",
        "non-composited-animations": "off",
        "prioritize-lcp-image": "off",

        // Dev server limitations (not minified/optimized in dev mode)
        "unminified-javascript": "off",
        "unused-javascript": "off",
        "unused-css-rules": "off",

        // Blockchain explorer has dynamic images from stamps - warn only
        "offscreen-images": "off",
        "unsized-images": "off",
        "uses-responsive-images": "off",
        "modern-image-formats": "off",

        // SEO/accessibility items to address separately - warn only
        "crawlable-anchors": ["warn", { minScore: 0 }],
        "errors-in-console": ["warn", { minScore: 0 }],
        "heading-order": ["warn", { minScore: 0 }],
        "image-redundant-alt": ["warn", { minScore: 0 }],
        "target-size": ["warn", { minScore: 0 }],
        "dom-size": ["warn", { minScore: 0 }],
        "legacy-javascript": "off",

        // Skipped audit - don't assert on it
        "uses-long-cache-ttl": "off",
      },
    },
    upload: {
      // Upload to temporary public storage
      target: "temporary-public-storage",
      // GitHub App token for PR status checks
      // Install app: https://github.com/apps/lighthouse-ci
      // Add token as LHCI_GITHUB_APP_TOKEN secret in GitHub Actions
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
  },
};
