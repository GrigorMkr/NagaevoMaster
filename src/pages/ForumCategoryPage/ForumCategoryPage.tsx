import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { ForumNewTopicForm } from '@/components/forum/ForumNewTopicForm/ForumNewTopicForm';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { FORUM_CATEGORIES } from '@/data/categories';
import { fetchForumTopics, type ForumTopicListItem } from '@/services/forumApi';
import { ROUTES, forumCategoryPath, forumTopicPath } from '@/utils/constants';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumCategoryPage.module.css';
function ForumCategoryTopicList({ category }: {
    category: string;
}) {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const [topics, setTopics] = useState<ForumTopicListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        fetchForumTopics(category)
            .then((data) => {
            if (!cancelled)
                setTopics(data);
        })
            .catch(() => {
            if (!cancelled)
                setTopics([]);
        })
            .finally(() => {
            if (!cancelled)
                setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [category]);
    return (<>
      <ul className={styles.list}>
        {topics.map((topic) => (<li key={topic.id}>
            <Link to={forumTopicPath(topic.id)} className={styles.topic}>
              <div className={styles.topicRow}>
                <UserAvatar
                  name={topic.authorName}
                  src={resolveAuthorAvatar(topic.authorName, topic.authorName, topic.authorAvatarUrl)}
                  size="xs"
                />
                <div className={styles.topicBody}>
                  <span className={styles.topicTitle}>
                    {topic.isPinned && '📌 '}{topic.title}
                  </span>
                  <span className={styles.meta}>
                    {topic.authorName} · {topic.postsCount} ответов ·{' '}
                    {format(new Date(topic.lastPostAt), 'd MMM', { locale: ru })}
                  </span>
                </div>
              </div>
            </Link>
          </li>))}
      </ul>

      {isLoading && <p className="textMuted">Загрузка…</p>}
      {!isLoading && topics.length === 0 && (<p className={pageStyles.emptyHint}>Тем в этой категории пока нет</p>)}

      {isAuthenticated ? (
        <ForumNewTopicForm
          defaultCategory={category}
          onCreated={(topic) => setTopics((prev) => [topic, ...prev])}
        />
      ) : (
        <p className={pageStyles.emptyHint}>
          <Link to={ROUTES.AUTH}>Войдите</Link>, чтобы создать тему в этой категории
        </p>
      )}
    </>);
}
function ForumCategoryPage() {
    const { category } = useParams<{
        category: string;
    }>();
    const forumCat = FORUM_CATEGORIES.find((c) => c.slug === category);
    if (!forumCat) {
        return (<div className={pageStyles.page}>
        <div className="container">
          <p>Категория не найдена</p>
          <Link to={ROUTES.FORUM}>← На форум</Link>
        </div>
      </div>);
    }
    return (<>
      <PageMeta title={`Форум — ${forumCat.name}`} canonical={forumCategoryPath(category!)}/>

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Форум" title={forumCat.name} />

          <Link to={ROUTES.FORUM} className={styles.back}>← Все категории</Link>

          {category && <ForumCategoryTopicList key={category} category={category}/>}
        </div>
      </div>
    </>);
}

export {
  ForumCategoryPage,
}
