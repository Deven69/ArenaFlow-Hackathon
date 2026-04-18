import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

vi.mock("@/lib/analytics", () => ({
  logEvent: vi.fn(),
}));

import React from "react";
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) =>
    React.createElement("div", {
      "data-testid": "qrcode-svg",
      "data-value": value,
    }, `QR:${value}`),
}));

vi.mock("@googlemaps/js-api-loader", () => ({
  Loader: vi.fn().mockImplementation(() => ({
    importLibrary: vi.fn().mockResolvedValue({}),
  })),
}));
