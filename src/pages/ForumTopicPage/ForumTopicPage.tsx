import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { MOCK_FORUM_TOPICS } from '@/data/mockListings'
import { ROUTES, forumTopicPath } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ForumTopicPage.module.css'

export function ForumTopicPage() {
  const { id } = useParams<{ id: string }>()
  const topic = MOCK_FORUM_TOPICS.find((t) => t.id === id)

  if (!topic) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p>Тема не найдена</p>
          <Link to={ROUTES.FORUM}>← На форум</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMeta title={topic.title} canonical={forumTopicPath(topic.id)} />

      <div className={pageStyles.page}>
        <div className="container">
          <Link to={ROUTES.FORUM} className={styles.back}>← Форум</Link>

          <article className={styles.card}>
            <h1 className="titlePage">{topic.title}</h1>
            <p className={styles.meta}>
              {topic.authorName} · {format(new Date(topic.lastPostAt), 'd MMMM yyyy', { locale: ru })}
            </p>

            <div className={styles.post}>
              <p>Обсуждение на форуме Нагаево. Подключите API для постов с Markdown, лайками и вложениями.</p>
            </div>

            <div className={styles.replies}>
              <h2>Ответы ({topic.postsCount})</h2>
              <p className="textMuted">Ветка ответов — только для авторизованных пользователей</p>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}
