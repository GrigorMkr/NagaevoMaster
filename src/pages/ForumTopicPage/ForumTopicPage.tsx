import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { fetchForumTopic, type ForumTopicDetail } from '@/services/forumApi';
import { ROUTES, forumTopicPath } from '@/utils/constants';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumTopicPage.module.css';
function ForumTopicPage() {
    const { id } = useParams<{
        id: string;
    }>();
    const [topic, setTopic] = useState<ForumTopicDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!id)
            return;
        fetchForumTopic(id)
            .then(setTopic)
            .catch(() => setTopic(null))
            .finally(() => setIsLoading(false));
    }, [id]);
    if (isLoading) {
        return (<div className={pageStyles.page}>
        <div className="container">
          <p className="textMuted">Загрузка темы…</p>
        </div>
      </div>);
    }
    if (!topic) {
        return (<div className={pageStyles.page}>
        <div className="container">
          <p>Тема не найдена</p>
          <Link to={ROUTES.FORUM}>← На форум</Link>
        </div>
      </div>);
    }
    return (<>
      <PageMeta title={topic.title} canonical={forumTopicPath(topic.id)}/>

      <div className={pageStyles.page}>
        <div className="container">
          <Link to={ROUTES.FORUM} className={styles.back}>← Форум</Link>

          <article className={styles.card}>
            <h1 className="titlePage">{topic.title}</h1>
            <p className={styles.meta}>
              {topic.authorName} · {format(new Date(topic.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>

            <div className={styles.post}>
              <p>{topic.content}</p>
            </div>

            <div className={styles.replies}>
              <h2>Ответы ({topic.posts.length})</h2>
              {topic.posts.length === 0 ? (<p className="textMuted">Пока нет ответов</p>) : (<ul className={styles.replyList}>
                  {topic.posts.map((post) => (<li key={post.id} className={styles.replyItem}>
                      <p className={styles.replyMeta}>
                        {post.authorName} ·{' '}
                        {format(new Date(post.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </p>
                      <p>{post.content}</p>
                    </li>))}
                </ul>)}
              <p className="textMuted">
                <Link to={ROUTES.AUTH}>Войдите</Link>, чтобы ответить в теме
              </p>
            </div>
          </article>
        </div>
      </div>
    </>);
}

export {
  ForumTopicPage,
}
