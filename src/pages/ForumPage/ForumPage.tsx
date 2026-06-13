import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { CategoryCard } from '@/components/categories/CategoryCard/CategoryCard';
import { FORUM_CATEGORIES } from '@/data/categories';
import { getForumCategoryCover } from '@/data/mock/listingImages';
import { fetchForumTopics, type ForumTopicListItem } from '@/services/forumApi';
import { forumCategoryPath, forumTopicPath, ROUTES } from '@/utils/constants';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumPage.module.css';
function ForumPage() {
    const [topics, setTopics] = useState<ForumTopicListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        fetchForumTopics()
            .then(setTopics)
            .catch(() => setTopics([]))
            .finally(() => setIsLoading(false));
    }, []);
    return (<>
      <PageMeta title="Форум" description="Форум поселка Нагаево — обсуждения, советы и взаимопомощь жителей." canonical="/forum"/>

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Сообщество" title="Форум Нагаево" subtitle="8 категорий — строительство, сантехника, спецтехника и общие вопросы"/>

          <Reveal delay={80}>
            <div className={`${styles.categoryGrid} motion-stagger`}>
              {FORUM_CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  to={forumCategoryPath(cat.slug)}
                  icon={cat.icon}
                  name={cat.name}
                  cover={getForumCategoryCover(cat.slug)}
                  variant="tile"
                />
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h2 className={styles.sectionTitle}>Актуальные темы</h2>
            <ul className={`${styles.list} motion-stagger`}>
            {topics.map((topic) => (<li key={topic.id}>
                <Link to={forumTopicPath(topic.id)} className={styles.topic}>
                  <span className={styles.topicTitle}>
                    {topic.isPinned && '📌 '}{topic.title}
                  </span>
                  <span className={styles.meta}>
                    {topic.authorName} · {topic.postsCount} ответов ·{' '}
                    {format(new Date(topic.lastPostAt), 'd MMM', { locale: ru })}
                  </span>
                </Link>
              </li>))}
          </ul>

          {isLoading && <p className="textMuted">Загрузка тем…</p>}
          {!isLoading && topics.length === 0 && (<p className={pageStyles.emptyHint}>Тем пока нет</p>)}

          <p className={pageStyles.emptyHint}>
            <Link to={ROUTES.AUTH}>Войдите</Link> чтобы создать новую тему
          </p>
          </Reveal>
        </div>
      </div>
    </>);
}

export {
  ForumPage,
}
