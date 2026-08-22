"use client";

export type GuestEngagementState = {
  actionsTaken: number;
  sessionsCompleted: number;
  lastCompletedDate: string | null;
  detailsOpened: number;
};

const GUEST_ENGAGEMENT_KEY = "revmatched.guest-engagement";

const defaultGuestEngagementState: GuestEngagementState = {
  actionsTaken: 0,
  sessionsCompleted: 0,
  lastCompletedDate: null,
  detailsOpened: 0,
};

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export function readGuestEngagement(): GuestEngagementState {
  if (typeof window === "undefined") {
    return defaultGuestEngagementState;
  }

  const savedState = window.localStorage.getItem(GUEST_ENGAGEMENT_KEY);

  if (!savedState) {
    return defaultGuestEngagementState;
  }

  try {
    const parsed = JSON.parse(savedState) as Partial<GuestEngagementState>;

    return {
      actionsTaken:
        typeof parsed.actionsTaken === "number" &&
        Number.isFinite(parsed.actionsTaken)
          ? parsed.actionsTaken
          : 0,
      sessionsCompleted:
        typeof parsed.sessionsCompleted === "number" &&
        Number.isFinite(parsed.sessionsCompleted)
          ? parsed.sessionsCompleted
          : 0,
      lastCompletedDate:
        typeof parsed.lastCompletedDate === "string"
          ? parsed.lastCompletedDate
          : null,
      detailsOpened:
        typeof parsed.detailsOpened === "number" &&
        Number.isFinite(parsed.detailsOpened)
          ? parsed.detailsOpened
          : 0,
    };
  } catch {
    return defaultGuestEngagementState;
  }
}

function writeGuestEngagement(nextState: GuestEngagementState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_ENGAGEMENT_KEY, JSON.stringify(nextState));
}

function updateGuestEngagement(
  update: (current: GuestEngagementState) => GuestEngagementState,
) {
  writeGuestEngagement(update(readGuestEngagement()));
}

export function trackGuestAction() {
  updateGuestEngagement((current) => ({
    ...current,
    actionsTaken: current.actionsTaken + 1,
  }));
}

export function trackGuestDetailsOpened() {
  updateGuestEngagement((current) => ({
    ...current,
    detailsOpened: current.detailsOpened + 1,
  }));
}

export function trackGuestSessionCompleted(date = new Date()) {
  const completedDate = getTodayKey(date);

  updateGuestEngagement((current) => {
    if (current.lastCompletedDate === completedDate) {
      return current;
    }

    return {
      ...current,
      sessionsCompleted: current.sessionsCompleted + 1,
      lastCompletedDate: completedDate,
    };
  });
}
