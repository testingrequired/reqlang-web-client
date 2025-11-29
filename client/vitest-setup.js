import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

/**
 * Mock window.matchMedia as jsdom doesn't support it
 */
let matchMediaMock;
let matchMediaOriginal;

beforeEach(() => {
  matchMediaMock = vi.fn();
  matchMediaOriginal = window.matchMedia;
  window.matchMedia = matchMediaMock;
});

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});
