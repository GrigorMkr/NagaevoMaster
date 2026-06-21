import { useCallback, useEffect, useState } from 'react';
import type { NewsItem } from '@/types/news';
import { NEWS_REFRESH_MS } from '@/constants';
import { fetchAllNews } from '@/services/newsApi';

interface NewsState {
  local: NewsItem[];
  external: NewsItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: NewsState = {
  local: [],
  external: [],
  loading: true,
  error: null,
  lastUpdated: null,
};

function useNews() {
  const [state, setState] = useState<NewsState>(initialState);

  const loadNews = useCallback(async (silent = false) => {
    if (!silent) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }
    try {
      const { local, external } = await fetchAllNews();
      setState({
        local,
        external,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.local.length > 0 ? null : 'Не удалось загрузить новости',
      }));
    }
  }, []);

  useEffect(() => {
    void loadNews();
    const interval = window.setInterval(() => {
      void loadNews(true);
    }, NEWS_REFRESH_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadNews(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadNews]);

  return state;
}

export {
  useNews,
};
