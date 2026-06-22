import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectCanModerate, selectIsAuthenticated } from '@/features/user/userSelectors';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { Button } from '@/components/ui/Button/Button';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { ForumReplyForm } from '@/components/forum/ForumReplyForm/ForumReplyForm';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { fetchForumTopic, type ForumTopicDetail } from '@/services/forumApi';
import {
  deleteModerationForumPost,
  deleteModerationForumTopic,
  editModerationForumPost,
  editModerationForumTopic,
} from '@/services/moderationApi';
import { ROUTES, forumTopicPath } from '@/utils/constants';
import { getErrorMessage } from '@/utils/errorMessage';
import { DetailBackdropLayout } from '@/components/layout/DetailBackdropLayout/DetailBackdropLayout';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumTopicPage.module.css';

function ForumTopicPage() {
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const canModerate = useAppSelector(selectCanModerate);
    const { id } = useParams<{
        id: string;
    }>();
    const [topic, setTopic] = useState<ForumTopicDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const loadTopic = useCallback(() => {
        if (!id) return;
        setIsLoading(true);
        fetchForumTopic(id)
            .then(setTopic)
            .catch(() => setTopic(null))
            .finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => {
        loadTopic();
    }, [loadTopic]);

    const handleEditTopic = async () => {
        if (!topic) return;
        const title = window.prompt('Заголовок темы', topic.title);
        if (!title || title.trim() === topic.title) return;
        setBusy(true);
        try {
            await editModerationForumTopic(topic.id, { title: title.trim() });
            toast.success('Тема обновлена');
            loadTopic();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось изменить тему'));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteTopic = async () => {
        if (!topic || !window.confirm('Удалить тему и все ответы?')) return;
        setBusy(true);
        try {
            await deleteModerationForumTopic(topic.id);
            toast.success('Тема удалена');
            navigate(ROUTES.FORUM);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось удалить тему'));
        } finally {
            setBusy(false);
        }
    };

    const handleEditPost = async (postId: string, content: string) => {
        const next = window.prompt('Текст ответа', content);
        if (!next || next.trim() === content) return;
        setBusy(true);
        try {
            await editModerationForumPost(postId, next.trim());
            toast.success('Ответ обновлён');
            loadTopic();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось изменить ответ'));
        } finally {
            setBusy(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('Удалить ответ?')) return;
        setBusy(true);
        try {
            await deleteModerationForumPost(postId);
            toast.success('Ответ удалён');
            loadTopic();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось удалить ответ'));
        } finally {
            setBusy(false);
        }
    };

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
          <DetailBackdropLayout className={styles.shell}>
            <Link to={ROUTES.FORUM} className={styles.back} data-detail-surface>← Форум</Link>

            <article className={styles.card} data-detail-surface>
            <h1 className="titlePage">{topic.title}</h1>
            <div className={styles.topicHead}>
              <UserAvatar
                name={topic.authorName}
                src={resolveAuthorAvatar(topic.authorName, topic.authorName, topic.authorAvatarUrl)}
                size="sm"
              />
              <p className={styles.meta}>
                {topic.authorName} · {format(new Date(topic.createdAt), 'd MMMM yyyy', { locale: ru })}
              </p>
            </div>

            {canModerate && (
              <div className={styles.modActions}>
                <Button type="button" size="sm" variant="outline" loading={busy} onClick={() => void handleEditTopic()}>
                  Изменить тему
                </Button>
                <Button type="button" size="sm" variant="danger" loading={busy} onClick={() => void handleDeleteTopic()}>
                  Удалить тему
                </Button>
              </div>
            )}

            <div className={styles.post}>
              <p>{topic.content}</p>
            </div>

            <div className={styles.replies}>
              <h2>Ответы ({topic.posts.length})</h2>
              {topic.posts.length === 0 ? (<p className="textMuted">Пока нет ответов</p>) : (<ul className={styles.replyList}>
                  {topic.posts.map((post) => (<li key={post.id} className={styles.replyItem}>
                      <div className={styles.replyHead}>
                        <UserAvatar
                          name={post.authorName}
                          src={resolveAuthorAvatar(post.authorName, post.authorName, post.authorAvatarUrl)}
                          size="sm"
                        />
                        <p className={styles.replyMeta}>
                          {post.authorName} ·{' '}
                          {format(new Date(post.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                        </p>
                      </div>
                      <p>{post.content}</p>
                      {canModerate && (
                        <div className={styles.modActions}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            loading={busy}
                            onClick={() => void handleEditPost(post.id, post.content)}
                          >
                            Изменить
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            loading={busy}
                            onClick={() => void handleDeletePost(post.id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </li>))}
                </ul>)}
              {isAuthenticated ? (
                <ForumReplyForm
                  topicId={topic.id}
                  disabled={topic.isClosed}
                  onReplyAdded={loadTopic}
                />
              ) : (
                <p className="textMuted">
                  <Link to={ROUTES.AUTH}>Войдите</Link>, чтобы ответить
                </p>
              )}
            </div>
          </article>
          </DetailBackdropLayout>
        </div>
      </div>
    </>);
}

export {
  ForumTopicPage,
}
