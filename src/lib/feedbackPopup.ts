// Single source of truth for the exit-intent / engagement feedback popup.
// Level 1 "configurable": every knob lives here. The shape is deliberately the
// one we'd later serve from the DB (GET /api/v1/feedback-popup-config) so that
// promoting this to runtime-editable config is a drop-in, not a rewrite.
//
// The popup is suggestion-only, so it reuses POST /api/feedback with no backend
// change. Decision logic below is pure and unit-tested; the component only wires
// browser triggers (timers, mouseout, storage) to these functions.

export type FeedbackPopupConfig = {
  enabled: boolean;
  triggers: {
    exitIntent: boolean;      // desktop: pointer leaves via the top edge
    minDwellSeconds: number;  // primary trigger: time on site
    minEventsViewed: number;  // primary trigger: distinct event detail pages seen
  };
  frequency: {
    oncePerSession: boolean;  // don't re-open within the same tab session
    cooldownDays: number;     // don't re-open across sessions for this many days
  };
  targeting: {
    excludePaths: string[];   // path prefixes where the popup never shows
  };
  copy: {
    title: string;
    prompt: string;
    placeholder: string;
    submitLabel: string;
    successText: string;
    dismissLabel: string;
  };
};

export const feedbackPopupConfig: FeedbackPopupConfig = {
  enabled: true,
  triggers: {
    exitIntent: true,
    minDwellSeconds: 30,
    minEventsViewed: 1,
  },
  frequency: {
    oncePerSession: true,
    cooldownDays: 30,
  },
  targeting: {
    excludePaths: ["/admin"],
  },
  copy: {
    title: "La trouvez-vous utile ?",
    prompt: "Aidez-nous à améliorer Paname Spot — laissez une suggestion.",
    placeholder: "Ce qui vous serait plus utile…",
    submitLabel: "Envoyer",
    successText: "Merci ! Votre suggestion a bien été enregistrée.",
    dismissLabel: "Plus tard",
  },
};

/** Slug of the event-detail page for this path, or null if it is not one. */
export function eventDetailSlug(pathname: string): string | null {
  return /^\/events\/([^/]+)$/.exec(pathname)?.[1] ?? null;
}

export function isExcluded(pathname: string, config: FeedbackPopupConfig = feedbackPopupConfig): boolean {
  return config.targeting.excludePaths.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Eligibility independent of which trigger fired: config, frequency, targeting. */
export function canShow(
  params: { pathname: string; alreadyOpened: boolean; sessionShown: boolean; cooldownUntil: number; now: number },
  config: FeedbackPopupConfig = feedbackPopupConfig,
): boolean {
  if (!config.enabled || params.alreadyOpened) return false;
  if (isExcluded(params.pathname, config)) return false;
  if (config.frequency.oncePerSession && params.sessionShown) return false;
  if (params.cooldownUntil > params.now) return false;
  return true;
}

/** Primary trigger: enough dwell time AND enough event-detail pages seen. */
export function primaryTriggerReady(
  state: { dwellReached: boolean; eventsViewed: number },
  config: FeedbackPopupConfig = feedbackPopupConfig,
): boolean {
  return state.dwellReached && state.eventsViewed >= config.triggers.minEventsViewed;
}

/** Fallback trigger: exit intent, gated on the user having engaged at all. */
export function exitTriggerReady(
  state: { eventsViewed: number },
  config: FeedbackPopupConfig = feedbackPopupConfig,
): boolean {
  if (!config.triggers.exitIntent) return false;
  return state.eventsViewed >= 1 || config.triggers.minEventsViewed === 0;
}

export function cooldownUntil(now: number, config: FeedbackPopupConfig = feedbackPopupConfig): number {
  return now + config.frequency.cooldownDays * 24 * 60 * 60 * 1000;
}
