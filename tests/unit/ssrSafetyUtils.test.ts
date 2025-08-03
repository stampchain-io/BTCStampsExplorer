/**
 * @fileoverview Comprehensive tests for SSR Safety Utils
 * Tests detection of SSR unsafe navigation patterns to prevent regressions
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "jsr:@std/testing@1.0.14/bdd";

describe("SSR Safety Detection", () => {
  describe("SSR Unsafe Navigation Patterns", () => {
    it("should detect globalThis.location.href without browser check", () => {
      const unsafeCode = `
        function handleClick() {
          globalThis.location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe globalThis.location.href usage",
      );
    });

    it("should detect window.location.href without browser check", () => {
      const unsafeCode = `
        function handleClick() {
          window.location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe window.location.href usage",
      );
    });

    it("should detect location.href without browser check", () => {
      const unsafeCode = `
        function handleClick() {
          location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe location.href usage",
      );
    });

    it("should detect location.assign without browser check", () => {
      const unsafeCode = `
        function handleClick() {
          location.assign('/new-url');
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe location.assign usage",
      );
    });

    it("should detect location.replace without browser check", () => {
      const unsafeCode = `
        function handleClick() {
          location.replace('/new-url');
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe location.replace usage",
      );
    });
  });

  describe("SSR Safe Navigation Patterns", () => {
    it("should recognize safe globalThis.location.href with browser check", () => {
      const safeCode = `
        function handleClick() {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          globalThis.location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize safe globalThis.location.href usage",
      );
    });

    it("should recognize safe window.location.href with browser check", () => {
      const safeCode = `
        function handleClick() {
          if (typeof window === "undefined" || !window?.location) {
            return;
          }
          window.location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize safe window.location.href usage",
      );
    });

    it("should recognize safe location methods with browser check", () => {
      const safeCode = `
        function handleClick() {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          location.assign('/new-url');
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize safe location methods usage",
      );
    });

    it("should recognize alternative browser checks", () => {
      const safeCode = `
        function handleClick() {
          if (!globalThis || !globalThis.location) {
            return;
          }
          globalThis.location.href = '/new-url';
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize alternative browser checks",
      );
    });

    it("should recognize useEffect browser checks", () => {
      const safeCode = `
        useEffect(() => {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          globalThis.location.href = '/new-url';
        }, []);
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize useEffect browser checks",
      );
    });
  });

  describe("Component-Specific SSR Safety", () => {
    it("should detect unsafe onClick handlers on anchor tags", () => {
      const unsafeCode = `
        <a href="#" onClick={(e) => {
          e.preventDefault();
          globalThis.location.href = '/new-url';
        }}>
          Click me
        </a>
      `;

      const isUnsafe = containsUnsafeOnClickHandler(unsafeCode);
      assertEquals(
        isUnsafe,
        true,
        "Should detect unsafe onClick handlers on anchor tags",
      );
    });

    it("should detect unsafe navigation in event handlers", () => {
      const unsafeCode = `
        const handleSort = (sortBy: string) => {
          const url = new URL(globalThis.location.href);
          url.searchParams.set('sort', sortBy);
          globalThis.location.href = url.toString();
        };
      `;

      const hasSafetyCheck = containsBrowserCheck(unsafeCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe navigation in event handlers",
      );
    });

    it("should recognize safe event handlers", () => {
      const safeCode = `
        const handleSort = (sortBy: string) => {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          const url = new URL(globalThis.location.href);
          url.searchParams.set('sort', sortBy);
          globalThis.location.href = url.toString();
        };
      `;

      const hasSafetyCheck = containsBrowserCheck(safeCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should recognize safe event handlers",
      );
    });
  });

  describe("Fresh.js Specific Patterns", () => {
    it("should detect improper anchor tag usage", () => {
      const unsafeCode = `
        <a href="/new-page" onClick={(e) => {
          e.preventDefault();
          globalThis.location.href = '/new-page';
        }}>
          Navigate
        </a>
      `;

      const hasImproperAnchor = containsImproperAnchorUsage(unsafeCode);
      assertEquals(
        hasImproperAnchor,
        true,
        "Should detect improper anchor tag usage",
      );
    });

    it("should recognize proper anchor tag usage", () => {
      const safeCode = `
        <a href="/new-page">
          Navigate
        </a>
      `;

      const hasImproperAnchor = containsImproperAnchorUsage(safeCode);
      assertEquals(
        hasImproperAnchor,
        false,
        "Should recognize proper anchor tag usage",
      );
    });

    it("should detect missing partial navigation", () => {
      const unsafeCode = `
        function handleNavigation() {
          globalThis.location.href = '/new-page';
        }
      `;

      const missesPartialNav = missingPartialNavigation(unsafeCode);
      assertEquals(
        missesPartialNav,
        true,
        "Should detect missing partial navigation",
      );
    });
  });

  describe("Edge Cases and Complex Patterns", () => {
    it("should handle multi-line functions", () => {
      const multiLineCode = `
        function complexNavigation() {
          const sortBy = 'date';
          const direction = 'desc';

          // This should be detected as unsafe
          globalThis.location.href = \`/sorted?sort=\${sortBy}&dir=\${direction}\`;
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(multiLineCode);
      assertEquals(
        hasSafetyCheck,
        false,
        "Should detect unsafe patterns in multi-line functions",
      );
    });

    it("should handle conditional navigation", () => {
      const conditionalCode = `
        function conditionalNavigation(condition: boolean) {
          if (condition) {
            if (typeof globalThis === "undefined" || !globalThis?.location) {
              return;
            }
            globalThis.location.href = '/conditional-page';
          }
        }
      `;

      const hasSafetyCheck = containsBrowserCheck(conditionalCode);
      assertEquals(
        hasSafetyCheck,
        true,
        "Should handle conditional navigation properly",
      );
    });

    it("should detect mixed safe and unsafe patterns", () => {
      const mixedCode = `
        function mixedNavigation() {
          // Safe pattern
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          globalThis.location.href = '/safe-page';

          // Unsafe pattern elsewhere
          setTimeout(() => {
            globalThis.location.href = '/unsafe-page';
          }, 1000);
        }
      `;

      const hasBothPatterns = containsBothSafeAndUnsafePatterns(mixedCode);
      assertEquals(
        hasBothPatterns,
        true,
        "Should detect mixed safe and unsafe patterns",
      );
    });
  });

  describe("Real-World Component Tests", () => {
    it("should validate sorting components", () => {
      const sortingCode = `
        const handleSortChange = (newSort: string) => {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          const url = new URL(globalThis.location.href);
          url.searchParams.set('sort', newSort);
          globalThis.location.href = url.toString();
        };
      `;

      const isSafe = containsBrowserCheck(sortingCode);
      assertEquals(isSafe, true, "Sorting components should be SSR safe");
    });

    it("should validate pagination components", () => {
      const paginationCode = `
        const handlePageChange = (page: number) => {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          const url = new URL(globalThis.location.href);
          url.searchParams.set('page', page.toString());
          globalThis.location.href = url.toString();
        };
      `;

      const isSafe = containsBrowserCheck(paginationCode);
      assertEquals(isSafe, true, "Pagination components should be SSR safe");
    });

    it("should validate modal components", () => {
      const modalCode = `
        const closeModal = () => {
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return;
          }
          const url = new URL(globalThis.location.href);
          url.searchParams.delete('modal');
          globalThis.location.href = url.toString();
        };
      `;

      const isSafe = containsBrowserCheck(modalCode);
      assertEquals(isSafe, true, "Modal components should be SSR safe");
    });
  });
});

// Helper functions for pattern detection
function containsBrowserCheck(code: string): boolean {
  const browserCheckPatterns = [
    /typeof globalThis === ['""]undefined['""]/,
    /typeof window === ['""]undefined['""]/,
    /!globalThis\?\./,
    /!window\?\./,
    /!globalThis\s*\|\|\s*!globalThis\.location/,
    /!window\s*\|\|\s*!window\.location/,
    /globalThis === ['""]undefined['""]/,
    /window === ['""]undefined['""]/,
  ];

  const navigationPatterns = [
    /globalThis\.location\.href/,
    /window\.location\.href/,
    /location\.href/,
    /location\.assign/,
    /location\.replace/,
  ];

  const hasNavigation = navigationPatterns.some((pattern) =>
    pattern.test(code)
  );
  const hasBrowserCheck = browserCheckPatterns.some((pattern) =>
    pattern.test(code)
  );

  return hasNavigation ? hasBrowserCheck : true;
}

function containsUnsafeOnClickHandler(code: string): boolean {
  const onClickPattern = /onClick.*{[\s\S]*?}/;
  const preventDefaultPattern = /e\.preventDefault\(\)/;
  const locationPattern =
    /globalThis\.location\.href|window\.location\.href|location\.href/;

  const hasOnClick = onClickPattern.test(code);
  const hasPreventDefault = preventDefaultPattern.test(code);
  const hasLocationChange = locationPattern.test(code);

  return hasOnClick && hasPreventDefault && hasLocationChange;
}

function containsImproperAnchorUsage(code: string): boolean {
  const anchorPattern = /<a[^>]*href[^>]*onClick/;
  const preventDefaultPattern = /e\.preventDefault\(\)/;

  return anchorPattern.test(code) && preventDefaultPattern.test(code);
}

function missingPartialNavigation(code: string): boolean {
  const navigationPattern =
    /globalThis\.location\.href|window\.location\.href|location\.href/;
  const partialNavPattern = /f-partial/;

  return navigationPattern.test(code) && !partialNavPattern.test(code);
}

function containsBothSafeAndUnsafePatterns(code: string): boolean {
  const safePattern = /typeof globalThis === ['""]undefined['""]/;
  const unsafeNavPattern = /globalThis\.location\.href/;

  // Split code into lines to check for patterns
  const lines = code.split("\n");
  let hasSafePattern = false;
  let hasUnsafePattern = false;

  for (const line of lines) {
    if (safePattern.test(line)) {
      hasSafePattern = true;
    }
    if (unsafeNavPattern.test(line) && !safePattern.test(line)) {
      hasUnsafePattern = true;
    }
  }

  return hasSafePattern && hasUnsafePattern;
}
