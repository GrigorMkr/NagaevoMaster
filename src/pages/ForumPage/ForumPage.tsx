import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { FORUM_CATEGORIES } from '@/data/categories'
import { MOCK_FORUM_TOPICS } from '@/data/mockListings'
import { forumCategoryPath, forumTopicPath, ROUTES } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ForumPage.module.css'

export function ForumPage() {
  return (
    <>
      <PageMeta
        title="Форум"
        description="Форум поселка Нагаево — обсуждения, советы и взаимопомощь жителей."
        canonical="/forum"
      />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader
            badge="Сообщество"
            title="Форум Нагаево"
            subtitle="8 категорий — строительство, сантехника, спецтехника и общие вопросы"
          />

          <div className={styles.categoryGrid}>
            {FORUM_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={forumCategoryPath(cat.slug)}
                className={styles.categoryCard}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Актуальные темы</h2>
          <ul className={styles.list}>
            {MOCK_FORUM_TOPICS.map((topic) => (
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

          <p className={styles.hint}>
            <Link to={ROUTES.AUTH}>Войдите</Link> чтобы создать новую тему
          </p>
        </div>
      </div>
    </>
  )
}
