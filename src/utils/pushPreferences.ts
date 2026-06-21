const STORAGE_KEY = 'nagaevo:push-enabled';

function isPushEnabledPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) return true;
    return value === '1' || value === 'true';
  } catch {
    return true;
  }
}

function setPushEnabledPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export {
  isPushEnabledPreference,
  setPushEnabledPreference,
};
