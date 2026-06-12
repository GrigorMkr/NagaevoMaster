import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { FORUM_CATEGORIES } from '@/data/categories'
import { fetchForumTopics, type ForumTopicListItem } from '@/services/forumApi'
import { ROUTES, forumCategoryPath, forumTopicPath } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ForumCategoryPage.module.css'

export function ForumCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const forumCat = FORUM_CATEGORIES.find((c) => c.slug === category)
  const [topics, setTopics] = useState<ForumTopicListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    setIsLoading(true)
    fetchForumTopics(category)
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setIsLoading(false))
  }, [category])

  if (!forumCat) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p>Категория не найдена</p>
          <Link to={ROUTES.FORUM}>← На форум</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMeta
        title={`Форум — ${forumCat.name}`}
        canonical={forumCategoryPath(category!)}
      />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Форум" title={forumCat.name} subtitle="Обсуждения жителей Нагаево" />

          <Link to={ROUTES.FORUM} className={styles.back}>← Все категории</Link>

          <ul className={styles.list}>
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link to={forumTopicPath(topic.id)} className={styles.topic}>
                  <span className={styles.topicTitle}>
                    {topic.isPinned && '📌 '}{topic.title}
                  </span>
                  <span className={styles.meta}>
                    {topic.authorName} · {topic.postsCount} ответов ·{' '}
                    {format(new Date(topic.lastPostAt), 'd MMM', { locale: ru })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {isLoading && <p className="textMuted">Загрузка…</p>}
          {!isLoading && topics.length === 0 && (
            <p className={pageStyles.emptyHint}>Тем в этой категории пока нет</p>
          )}
        </div>
      </div>
    </>
  )
}
