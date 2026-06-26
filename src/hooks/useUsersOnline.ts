import { useEffect, useMemo, useState } from 'react';
import { fetchUsersOnlineStatus } from '@/services/presenceApi';

const POLL_INTERVAL_MS = 30_000;

function useUsersOnline(userIds: string[]): Record<string, boolean> {
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const idsKey = useMemo(
    () => [...new Set(userIds.filter(Boolean))].sort().join(','),
    [userIds],
  );

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setOnlineMap({});
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchUsersOnlineStatus(ids);
        if (!cancelled) {
          setOnlineMap(next);
        }
      } catch {
        if (!cancelled) {
          setOnlineMap({});
        }
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [idsKey]);

  return onlineMap;
}

export {
  useUsersOnline,
};
