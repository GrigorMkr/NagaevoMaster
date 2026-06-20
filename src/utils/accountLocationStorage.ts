import type { AccountLocation } from '@/types/location';
import { USER_LOCATION_STORAGE_KEY } from '@/constants/user-location';

function saveStoredAccountLocation(location: AccountLocation) {
    localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function removeStoredAccountLocation() {
    localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
}

function loadStoredAccountLocation(): AccountLocation | null {
    try {
        const raw = localStorage.getItem(USER_LOCATION_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as AccountLocation;
        if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}

export {
  saveStoredAccountLocation,
  removeStoredAccountLocation,
  loadStoredAccountLocation,
}
