// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsDark } from "@/lib/useIsDark";

let mediaMatches = false;

beforeEach(() => {
  mediaMatches = false;
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return mediaMatches; },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => document.documentElement.removeAttribute("data-theme"));

describe("useIsDark", () => {
  it("honors an explicit data-theme over the OS preference", () => {
    mediaMatches = true;
    document.documentElement.setAttribute("data-theme", "light");
    const light = renderHook(() => useIsDark());
    expect(light.result.current).toBe(false);
    light.unmount();

    document.documentElement.setAttribute("data-theme", "dark");
    const dark = renderHook(() => useIsDark());
    expect(dark.result.current).toBe(true);
    dark.unmount();
  });
  it("falls back to the OS preference when no theme is set", () => {
    mediaMatches = true;
    const { result, unmount } = renderHook(() => useIsDark());
    expect(result.current).toBe(true);
    unmount();
  });
  it("reacts to a data-theme mutation after mount", async () => {
    const { result, unmount } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);
    await act(async () => {
      document.documentElement.setAttribute("data-theme", "dark");
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
    unmount();
  });
});
