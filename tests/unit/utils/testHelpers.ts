/**
 * Test utilities for mocking browser APIs and DOM elements
 * These utilities ensure tests can run in CI without a real browser
 */

// Mock DOM Element
export class MockHTMLElement {
  constructor(
    public tagName: string = "div",
    public attributes: Record<string, string> = {},
  ) {}

  focus(): void {
    // Mock focus behavior
  }

  addEventListener(): void {
    // Mock event listener
  }

  removeEventListener(): void {
    // Mock event listener removal
  }

  querySelector(): MockHTMLElement | null {
    return null;
  }

  querySelectorAll(): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }
}

// Mock Document
export function createMockDocument() {
  const elements = new Map<string, MockHTMLElement>();

  return {
    querySelector: (selector: string): MockHTMLElement | null => {
      return elements.get(selector) || null;
    },
    querySelectorAll: (selector: string): NodeListOf<Element> => {
      const matching = Array.from(elements.entries())
        .filter(([key]) => key.includes(selector.replace(/[\[\]]/g, "")))
        .map(([, element]) => element);
      return matching as unknown as NodeListOf<Element>;
    },
    addEventListener: (_event: string, _handler: EventListener): void => {
      // Mock implementation
    },
    removeEventListener: (_event: string, _handler: EventListener): void => {
      // Mock implementation
    },
    activeElement: null as Element | null,
    // Helper to add mock elements for testing
    _addMockElement: (selector: string, element: MockHTMLElement) => {
      elements.set(selector, element);
    },
    _clearMockElements: () => {
      elements.clear();
    },
  };
}

// Mock Window
export function createMockWindow() {
  return {
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      dispatchEvent: () => true,
      onchange: null,
    }),
    location: {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      protocol: "http:",
      host: "localhost:3000",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    navigator: {
      userAgent: "Mozilla/5.0 (Testing) Chrome/100.0",
      language: "en-US",
      languages: ["en-US", "en"],
      onLine: true,
    },
    localStorage: createMockStorage(),
    sessionStorage: createMockStorage(),
  };
}

// Mock Storage
export function createMockStorage() {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string): string | null => storage.get(key) || null,
    setItem: (key: string, value: string): void => {
      storage.set(key, value);
    },
    removeItem: (key: string): void => {
      storage.delete(key);
    },
    clear: (): void => {
      storage.clear();
    },
    get length(): number {
      return storage.size;
    },
    key: (index: number): string | null => {
      const keys = Array.from(storage.keys());
      return keys[index] || null;
    },
  };
}

// Setup and teardown helpers
export function setupDOM() {
  const mockDoc = createMockDocument();
  const mockWin = createMockWindow();

  // @ts-ignore - Setting up global mocks
  globalThis.document = mockDoc;
  // @ts-ignore - Setting up global mocks
  globalThis.window = mockWin;
  // @ts-ignore - Setting up global mocks
  globalThis.matchMedia = mockWin.matchMedia;

  return { mockDoc, mockWin };
}

export function teardownDOM() {
  // @ts-ignore - Cleaning up global mocks
  delete globalThis.document;
  // @ts-ignore - Cleaning up global mocks
  delete globalThis.window;
  // @ts-ignore - Cleaning up global mocks
  delete globalThis.matchMedia;
}

// Utility to run tests with DOM
export async function withDOM<T>(
  fn: (
    mocks: {
      mockDoc: ReturnType<typeof createMockDocument>;
      mockWin: ReturnType<typeof createMockWindow>;
    },
  ) => T | Promise<T>,
): Promise<T> {
  const mocks = setupDOM();
  try {
    return await fn(mocks);
  } finally {
    teardownDOM();
  }
}

// Mock fetch for API tests
export function createMockFetch(
  responses: Map<string, { status: number; data: any }>,
) {
  return (
    url: string | URL | Request,
    _init?: RequestInit,
  ): Promise<Response> => {
    const urlString = typeof url === "string" ? url : url.toString();
    const response = responses.get(urlString);

    if (!response) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }

    return Promise.resolve(
      new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };
}

// Time mocking utilities
export function mockDate(date: Date | string) {
  const mockedDate = typeof date === "string" ? new Date(date) : date;
  const originalDate = globalThis.Date;

  // @ts-ignore - Mocking Date
  globalThis.Date = class extends originalDate {
    constructor(...args: any[]) {
      // Always call super with spread args
      // @ts-ignore - Known issue with spread args in Date constructor
      super(...(args.length === 0 ? [mockedDate.getTime()] : args));
    }

    static override now() {
      return mockedDate.getTime();
    }
  };

  return () => {
    globalThis.Date = originalDate;
  };
}

// Mock crypto for security tests
export function createMockCrypto() {
  return {
    getRandomValues: (array: Uint8Array): Uint8Array => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: (): string => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  };
}
