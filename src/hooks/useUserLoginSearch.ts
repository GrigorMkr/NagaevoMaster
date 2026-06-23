import { useEffect, useState } from 'react';
import { searchFriends } from '@/services/friendsApi';
import type { FriendSearchResult } from '@/types/friend';

function normalizeLoginQuery(query: string) {
  return query.replace(/^@+/, '').trim();
}

function useUserLoginSearch(query: string, enabled = true) {
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const normalized = normalizeLoginQuery(query);
    if (normalized.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchFriends(normalized)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, query]);

  return { results, loading };
}

export {
  normalizeLoginQuery,
  useUserLoginSearch,
};
