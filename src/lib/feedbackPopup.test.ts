import { describe, expect, it } from "vitest";
import {
  canShow,
  cooldownUntil,
  eventDetailSlug,
  exitTriggerReady,
  feedbackPopupConfig,
  isExcluded,
  primaryTriggerReady,
  type FeedbackPopupConfig,
} from "@/lib/feedbackPopup";

const base: FeedbackPopupConfig = feedbackPopupConfig;
function withTriggers(over: Partial<FeedbackPopupConfig["triggers"]>): FeedbackPopupConfig {
  return { ...base, triggers: { ...base.triggers, ...over } };
}

describe("eventDetailSlug", () => {
  it("extracts the slug from an event-detail path only", () => {
    expect(eventDetailSlug("/events/open-air-cinema-a1b2")).toBe("open-air-cinema-a1b2");
    expect(eventDetailSlug("/events")).toBeNull();
    expect(eventDetailSlug("/events/open-air/extra")).toBeNull();
    expect(eventDetailSlug("/decouvrir")).toBeNull();
  });
});

describe("isExcluded", () => {
  it("matches an excluded prefix and its descendants but not lookalikes", () => {
    expect(isExcluded("/admin")).toBe(true);
    expect(isExcluded("/admin/feedback")).toBe(true);
    expect(isExcluded("/administratif")).toBe(false);
    expect(isExcluded("/")).toBe(false);
  });
});

describe("canShow", () => {
  const ok = { pathname: "/decouvrir", alreadyOpened: false, sessionShown: false, cooldownUntil: 0, now: 1_000 };

  it("allows when nothing blocks it", () => {
    expect(canShow(ok)).toBe(true);
  });
  it("blocks when disabled, already open, excluded, shown this session, or in cooldown", () => {
    expect(canShow(ok, { ...base, enabled: false })).toBe(false);
    expect(canShow({ ...ok, alreadyOpened: true })).toBe(false);
    expect(canShow({ ...ok, pathname: "/admin/feedback" })).toBe(false);
    expect(canShow({ ...ok, sessionShown: true })).toBe(false);
    expect(canShow({ ...ok, cooldownUntil: 2_000 })).toBe(false);
  });
  it("re-allows once the cooldown has elapsed", () => {
    expect(canShow({ ...ok, cooldownUntil: 2_000, now: 3_000 })).toBe(true);
  });
});

describe("primaryTriggerReady", () => {
  it("needs both dwell and enough event views", () => {
    const cfg = withTriggers({ minEventsViewed: 1 });
    expect(primaryTriggerReady({ dwellReached: false, eventsViewed: 5 }, cfg)).toBe(false);
    expect(primaryTriggerReady({ dwellReached: true, eventsViewed: 0 }, cfg)).toBe(false);
    expect(primaryTriggerReady({ dwellReached: true, eventsViewed: 1 }, cfg)).toBe(true);
  });
  it("fires on dwell alone when no event views are required", () => {
    expect(primaryTriggerReady({ dwellReached: true, eventsViewed: 0 }, withTriggers({ minEventsViewed: 0 }))).toBe(true);
  });
});

describe("exitTriggerReady", () => {
  it("is off when exit intent is disabled", () => {
    expect(exitTriggerReady({ eventsViewed: 3 }, withTriggers({ exitIntent: false }))).toBe(false);
  });
  it("requires engagement unless no views are required", () => {
    const gated = withTriggers({ exitIntent: true, minEventsViewed: 1 });
    expect(exitTriggerReady({ eventsViewed: 0 }, gated)).toBe(false);
    expect(exitTriggerReady({ eventsViewed: 1 }, gated)).toBe(true);
    expect(exitTriggerReady({ eventsViewed: 0 }, withTriggers({ exitIntent: true, minEventsViewed: 0 }))).toBe(true);
  });
});

describe("cooldownUntil", () => {
  it("adds the configured cooldown window to now", () => {
    const now = 1_000_000;
    expect(cooldownUntil(now, { ...base, frequency: { ...base.frequency, cooldownDays: 1 } })).toBe(now + 86_400_000);
  });
});
