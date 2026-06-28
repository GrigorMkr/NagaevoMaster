const STORAGE_KEY = 'nagaevomaster-rustore-review';

const MIN_SESSIONS = 5;
const MIN_DAYS_SINCE_FIRST_OPEN = 3;
const RETRY_COOLDOWN_DAYS = 14;
const ACTIVITY_DELAY_MS = 90_000;

interface ReviewStorageState {
  firstOpenAt: string;
  sessionCount: number;
  lastSessionDay: string | null;
  lastAttemptAt: string | null;
  lastLaunchedAt: string | null;
}

function readState(): ReviewStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    const parsed = JSON.parse(raw) as Partial<ReviewStorageState>;
    return {
      firstOpenAt: parsed.firstOpenAt ?? new Date().toISOString(),
      sessionCount: parsed.sessionCount ?? 0,
      lastSessionDay: parsed.lastSessionDay ?? null,
      lastAttemptAt: parsed.lastAttemptAt ?? null,
      lastLaunchedAt: parsed.lastLaunchedAt ?? null,
    };
  } catch {
    return createInitialState();
  }
}

function writeState(state: ReviewStorageState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createInitialState(): ReviewStorageState {
  return {
    firstOpenAt: new Date().toISOString(),
    sessionCount: 0,
    lastSessionDay: null,
    lastAttemptAt: null,
    lastLaunchedAt: null,
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, to = Date.now()): number {
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) {
    return 0;
  }
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function registerRuStoreReviewSession(): ReviewStorageState {
  const state = readState();
  const day = todayKey();
  if (state.lastSessionDay !== day) {
    state.sessionCount += 1;
    state.lastSessionDay = day;
    writeState(state);
  }
  return state;
}

function canAttemptRuStoreReview(state = readState(), now = Date.now()): boolean {
  if (daysBetween(state.firstOpenAt, now) < MIN_DAYS_SINCE_FIRST_OPEN) {
    return false;
  }
  if (state.sessionCount < MIN_SESSIONS) {
    return false;
  }
  if (state.lastAttemptAt && daysBetween(state.lastAttemptAt, now) < RETRY_COOLDOWN_DAYS) {
    return false;
  }
  return true;
}

function markRuStoreReviewAttempt(now = new Date()): void {
  const state = readState();
  state.lastAttemptAt = now.toISOString();
  writeState(state);
}

function markRuStoreReviewLaunched(now = new Date()): void {
  const state = readState();
  state.lastLaunchedAt = now.toISOString();
  writeState(state);
}

export {
  ACTIVITY_DELAY_MS,
  MIN_DAYS_SINCE_FIRST_OPEN,
  MIN_SESSIONS,
  RETRY_COOLDOWN_DAYS,
  canAttemptRuStoreReview,
  markRuStoreReviewAttempt,
  markRuStoreReviewLaunched,
  registerRuStoreReviewSession,
};

export type {
  ReviewStorageState,
};
