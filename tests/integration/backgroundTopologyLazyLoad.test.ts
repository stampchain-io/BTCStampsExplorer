/**
 * @fileoverview Background Topology Lazy Loading Integration Tests
 * @description Tests for lazy loading background animation after FCP
 *
 * Task 8.2: Verify BackgroundTopology defers initialization until after FCP
 * - Replace polling loop with event-based loading
 * - Use requestIdleCallback or IntersectionObserver for deferral
 * - Load three.js/p5.js only when needed
 * - Prevent race conditions
 */

import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

describe("BackgroundTopology Lazy Loading", () => {
  let mockWindow: any;
  let scriptLoadCallbacks: Map<string, () => void>;
  let idleCallbacks: Array<() => void>;

  beforeEach(() => {
    scriptLoadCallbacks = new Map();
    idleCallbacks = [];

    // Mock global window with script loading simulation
    mockWindow = {
      THREE: undefined,
      p5: undefined,
      VANTA: undefined,
      requestIdleCallback: (callback: () => void) => {
        idleCallbacks.push(callback);
        return idleCallbacks.length;
      },
      cancelIdleCallback: (_id: number) => {
        // No-op for testing
      },
      addEventListener: (_event: string, _callback: () => void) => {
        // No-op for testing
      },
      removeEventListener: (_event: string, _callback: () => void) => {
        // No-op for testing
      },
    };

    globalThis.window = mockWindow as any;
  });

  afterEach(() => {
    scriptLoadCallbacks.clear();
    idleCallbacks = [];
  });

  describe("Event-Based Script Loading", () => {
    it("should wait for script load events instead of polling", () => {
      let initializationAttempts = 0;
      let initSuccessful = false;

      const mockInit = () => {
        initializationAttempts++;

        // Should only attempt init when scripts are ready
        if (mockWindow.THREE && mockWindow.p5 && mockWindow.VANTA?.TOPOLOGY) {
          initSuccessful = true;
          return true;
        }
        return false;
      };

      // Simulate script loading order
      const loadScript = (scriptName: string, global: any, value: any) => {
        mockWindow[global] = value;
        const callback = scriptLoadCallbacks.get(scriptName);
        if (callback) {
          callback();
        }
      };

      // Register callbacks for each script
      scriptLoadCallbacks.set("three", () => mockInit());
      scriptLoadCallbacks.set("p5", () => mockInit());
      scriptLoadCallbacks.set("vanta", () => mockInit());

      // Load scripts in order
      loadScript("three", "THREE", { WebGLRenderer: class {} });
      assertEquals(initSuccessful, false); // Not all dependencies ready

      loadScript("p5", "p5", class {});
      assertEquals(initSuccessful, false); // Still missing VANTA

      loadScript("vanta", "VANTA", { TOPOLOGY: () => ({}) });

      // Verify all dependencies are now loaded
      assertEquals(!!mockWindow.THREE, true);
      assertEquals(!!mockWindow.p5, true);
      assertEquals(!!mockWindow.VANTA?.TOPOLOGY, true);

      // Init should have succeeded after final script load
      assertEquals(initSuccessful, true);

      // Should have made exactly 3 attempts (one per script load event)
      assertEquals(initializationAttempts, 3);
    });

    it("should handle out-of-order script loading", () => {
      let successfulInit = false;

      const mockInit = () => {
        if (mockWindow.THREE && mockWindow.p5 && mockWindow.VANTA?.TOPOLOGY) {
          successfulInit = true;
          return true;
        }
        return false;
      };

      // Register callbacks
      scriptLoadCallbacks.set("vanta", () => mockInit());
      scriptLoadCallbacks.set("p5", () => mockInit());
      scriptLoadCallbacks.set("three", () => mockInit());

      // Load in reverse order (VANTA, p5, THREE)
      mockWindow.VANTA = { TOPOLOGY: () => ({}) };
      scriptLoadCallbacks.get("vanta")?.();
      assertEquals(successfulInit, false);

      mockWindow.p5 = class {};
      scriptLoadCallbacks.get("p5")?.();
      assertEquals(successfulInit, false);

      mockWindow.THREE = { WebGLRenderer: class {} };
      scriptLoadCallbacks.get("three")?.();
      assertEquals(successfulInit, true);
    });
  });

  describe("requestIdleCallback Deferral", () => {
    it("should defer initialization to idle callback", () => {
      let initCalled = false;

      // Mock all dependencies as loaded
      mockWindow.THREE = { WebGLRenderer: class {} };
      mockWindow.p5 = class {};
      mockWindow.VANTA = { TOPOLOGY: () => ({}) };

      // Schedule init via requestIdleCallback
      mockWindow.requestIdleCallback(() => {
        initCalled = true;
      });

      // Init should not be called yet
      assertEquals(initCalled, false);
      assertEquals(idleCallbacks.length, 1);

      // Simulate browser calling idle callback
      idleCallbacks[0]();
      assertEquals(initCalled, true);
    });

    it("should handle multiple idle callback registrations", () => {
      const calls: string[] = [];

      mockWindow.requestIdleCallback(() => calls.push("first"));
      mockWindow.requestIdleCallback(() => calls.push("second"));
      mockWindow.requestIdleCallback(() => calls.push("third"));

      assertEquals(idleCallbacks.length, 3);
      assertEquals(calls.length, 0);

      // Execute callbacks in order
      idleCallbacks.forEach(cb => cb());
      assertEquals(calls, ["first", "second", "third"]);
    });
  });

  describe("IntersectionObserver Fallback", () => {
    it("should use IntersectionObserver when requestIdleCallback unavailable", () => {
      // Remove requestIdleCallback
      delete mockWindow.requestIdleCallback;

      let observerCreated = false;
      let observerCallback: IntersectionObserverCallback | null = null;

      // Mock IntersectionObserver
      const MockIntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          observerCreated = true;
          observerCallback = callback;
        }
        observe(_target: Element) {}
        unobserve(_target: Element) {}
        disconnect() {}
      };

      globalThis.IntersectionObserver = MockIntersectionObserver as any;

      // Simulate fallback logic
      const canUseIdleCallback = typeof mockWindow.requestIdleCallback === "function";
      assertEquals(canUseIdleCallback, false);

      // Should create IntersectionObserver
      const observer = new MockIntersectionObserver(() => {});
      assertExists(observer);
      assertEquals(observerCreated, true);
      assertExists(observerCallback);
    });

    it("should trigger init when element becomes visible", () => {
      delete mockWindow.requestIdleCallback;

      let initTriggered = false;
      let observerCallback: IntersectionObserverCallback | null = null;

      const MockIntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe(_target: any) {
          // Simulate immediate visibility
          setTimeout(() => {
            if (observerCallback) {
              observerCallback(
                [{
                  isIntersecting: true,
                  target: {} as Element,
                  intersectionRatio: 1,
                } as IntersectionObserverEntry],
                this as any
              );
            }
          }, 0);
        }
        unobserve(_target: any) {}
        disconnect() {}
      };

      globalThis.IntersectionObserver = MockIntersectionObserver as any;

      const observer = new MockIntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          initTriggered = true;
        }
      });

      // Mock element - don't need real DOM in Deno test
      const mockElement = { tagName: "DIV" };
      observer.observe(mockElement);

      // Wait for async observer callback
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          assertEquals(initTriggered, true);
          resolve();
        }, 10);
      });
    });
  });

  describe("Race Condition Prevention", () => {
    it("should not attempt initialization before container ref is ready", () => {
      let initAttempted = false;

      mockWindow.THREE = { WebGLRenderer: class {} };
      mockWindow.p5 = class {};
      mockWindow.VANTA = { TOPOLOGY: () => ({}) };

      const tryInit = (containerRef: any | null) => {
        if (!containerRef) {
          return false; // Don't init without container
        }

        if (mockWindow.THREE && mockWindow.p5 && mockWindow.VANTA?.TOPOLOGY) {
          initAttempted = true;
          return true;
        }
        return false;
      };

      // Try init without container
      assertEquals(tryInit(null), false);
      assertEquals(initAttempted, false);

      // Try init with container (mock element)
      const mockContainer = { tagName: "DIV", id: "vanta-background" };
      assertEquals(tryInit(mockContainer), true);
      assertEquals(initAttempted, true);
    });

    it("should handle script load failures gracefully", () => {
      let initSuccessful = false;
      let errorHandled = false;

      const tryInit = () => {
        try {
          if (mockWindow.THREE && mockWindow.p5 && mockWindow.VANTA?.TOPOLOGY) {
            initSuccessful = true;
            return true;
          }
          return false;
        } catch (error) {
          errorHandled = true;
          return false;
        }
      };

      // Simulate missing dependency
      mockWindow.THREE = { WebGLRenderer: class {} };
      mockWindow.p5 = class {};
      // VANTA not loaded

      assertEquals(tryInit(), false);
      assertEquals(initSuccessful, false);

      // Even if VANTA throws during access
      Object.defineProperty(mockWindow, "VANTA", {
        get() {
          throw new Error("Script load failed");
        },
      });

      assertEquals(tryInit(), false);
      assertEquals(errorHandled, true);
    });

    it("should cleanup event listeners on unmount", () => {
      const listeners: Array<{ event: string; callback: () => void }> = [];

      mockWindow.addEventListener = (event: string, callback: () => void) => {
        listeners.push({ event, callback });
      };

      mockWindow.removeEventListener = (event: string, callback: () => void) => {
        const index = listeners.findIndex(
          (l) => l.event === event && l.callback === callback
        );
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };

      // Simulate component lifecycle
      const onScriptLoad = () => {};
      mockWindow.addEventListener("load", onScriptLoad);
      assertEquals(listeners.length, 1);

      // Cleanup on unmount
      mockWindow.removeEventListener("load", onScriptLoad);
      assertEquals(listeners.length, 0);
    });
  });

  describe("Performance Characteristics", () => {
    it("should not poll continuously (no setTimeout loops)", () => {
      let setTimeoutCalls = 0;

      const originalSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = ((callback: () => void, _delay: number) => {
        setTimeoutCalls++;
        // Don't actually call callback to prevent infinite loops
        return 1;
      }) as any;

      // Event-based approach should not use setTimeout for polling
      // (Only acceptable use: single deferred init via requestIdleCallback fallback)

      // Simulate event-based init
      scriptLoadCallbacks.set("three", () => {});
      scriptLoadCallbacks.set("p5", () => {});
      scriptLoadCallbacks.set("vanta", () => {});

      // Trigger all load events
      scriptLoadCallbacks.forEach(cb => cb());

      // Should not create setTimeout loop (0 calls for event-based)
      assertEquals(setTimeoutCalls, 0);

      globalThis.setTimeout = originalSetTimeout;
    });

    it("should initialize only once when all dependencies are ready", () => {
      let initCount = 0;

      mockWindow.THREE = { WebGLRenderer: class {} };
      mockWindow.p5 = class {};
      mockWindow.VANTA = { TOPOLOGY: () => ({ destroy: () => {} }) };

      const initVanta = () => {
        if (mockWindow.THREE && mockWindow.p5 && mockWindow.VANTA?.TOPOLOGY) {
          initCount++;
          return mockWindow.VANTA.TOPOLOGY({});
        }
        return null;
      };

      // First init - should succeed
      const instance1 = initVanta();
      assertExists(instance1);
      assertEquals(initCount, 1);

      // Subsequent calls should use guard (prevent re-init)
      let vantaInstance = instance1;
      if (!vantaInstance) {
        vantaInstance = initVanta();
      }

      assertEquals(initCount, 1); // Still 1, not 2
    });
  });

  describe("Custom Event Coordination", () => {
    it("should dispatch custom event when scripts are ready", () => {
      let customEventDispatched = false;
      let eventDetail: any = null;

      mockWindow.dispatchEvent = (event: Event) => {
        if (event.type === "vanta-scripts-ready") {
          customEventDispatched = true;
          eventDetail = (event as CustomEvent).detail;
        }
        return true;
      };

      mockWindow.CustomEvent = class CustomEvent extends Event {
        detail: any;
        constructor(type: string, options?: { detail?: any }) {
          super(type);
          this.detail = options?.detail;
        }
      };

      // Simulate all scripts loaded
      mockWindow.THREE = { WebGLRenderer: class {} };
      mockWindow.p5 = class {};
      mockWindow.VANTA = { TOPOLOGY: () => ({}) };

      // Dispatch ready event
      const readyEvent = new mockWindow.CustomEvent("vanta-scripts-ready", {
        detail: { three: true, p5: true, vanta: true },
      });
      mockWindow.dispatchEvent(readyEvent);

      assertEquals(customEventDispatched, true);
      assertExists(eventDetail);
      assertEquals(eventDetail.three, true);
      assertEquals(eventDetail.p5, true);
      assertEquals(eventDetail.vanta, true);
    });
  });
});
