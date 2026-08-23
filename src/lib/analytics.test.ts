// @vitest-environment jsdom
import {act, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
    GA_MEASUREMENT_ID,
    analyticsEnabled,
    gaBootstrap,
    gaScriptSrc,
    readConsent,
    resetConsent,
    subscribeConsent,
    trackPageView,
    useConsent,
    writeConsent,
} from "@/lib/analytics";

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("gtag helpers", () => {
    it("is enabled with a default measurement id", () => {
        expect(analyticsEnabled).toBe(true);
        expect(GA_MEASUREMENT_ID).toMatch(/^G-/);
    });

    it("builds the loader src from the id", () => {
        expect(gaScriptSrc("G-TEST")).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST");
    });

    it("bootstraps dataLayer and configures the id", () => {
        const boot = gaBootstrap("G-TEST");
        expect(boot).toContain("window.dataLayer");
        expect(boot).toContain("gtag('config','G-TEST')");
    });

    it("sends a page_view through window.gtag when present", () => {
        const gtag = vi.fn();
        vi.stubGlobal("gtag", gtag);
        trackPageView("/decouvrir");
        expect(gtag).toHaveBeenCalledWith("event", "page_view", {page_path: "/decouvrir"});
    });

    it("no-ops when gtag is absent", () => {
        expect(() => trackPageView("/aujourdhui")).not.toThrow();
    });
});

describe("consent store", () => {
    it("returns null until a choice is stored", () => {
        expect(readConsent()).toBeNull();
    });

    it("persists and reads back a choice", () => {
        writeConsent("granted");
        expect(readConsent()).toBe("granted");
        writeConsent("denied");
        expect(readConsent()).toBe("denied");
    });

    it("ignores an unrecognized stored value", () => {
        localStorage.setItem("ps-consent", "maybe");
        expect(readConsent()).toBeNull();
    });

    it("reset clears the choice", () => {
        writeConsent("granted");
        resetConsent();
        expect(readConsent()).toBeNull();
    });

    it("notifies subscribers on write and reset", () => {
        const cb = vi.fn();
        const unsubscribe = subscribeConsent(cb);
        writeConsent("granted");
        resetConsent();
        expect(cb).toHaveBeenCalledTimes(2);
        unsubscribe();
        writeConsent("denied");
        expect(cb).toHaveBeenCalledTimes(2);
    });
});

describe("useConsent", () => {
    it("exposes the current choice and updates it reactively", () => {
        const {result} = renderHook(() => useConsent());
        expect(result.current.choice).toBeNull();

        act(() => result.current.setChoice("granted"));
        expect(result.current.choice).toBe("granted");
        expect(readConsent()).toBe("granted");

        act(() => result.current.reset());
        expect(result.current.choice).toBeNull();
    });
});
