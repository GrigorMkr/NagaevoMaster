import { useEffect, useState } from 'react'
import type { NewsItem } from '@/types/news'
import { fetchAllNews } from '@/services/newsApi'

interface NewsState {
  local: NewsItem[]
  external: NewsItem[]
  loading: boolean
  error: string | null
}

const initialState: NewsState = {
  local: [],
  external: [],
  loading: true,
  error: null,
}

export function useNews() {
  const [state, setState] = useState<NewsState>(initialState)

  useEffect(() => {
    let cancelled = false

    fetchAllNews()
      .then(({ local, external }) => {
        if (!cancelled) {
          setState({ local, external, loading: false, error: null })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Не удалось загрузить новости',
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
