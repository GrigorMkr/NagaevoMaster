import { memo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FORUM_TOPICS_PREVIEW_COUNT, ROUTES, forumTopicPath } from '@/constants';
import { MOCK_FORUM_TOPICS } from '@/data/mockListings';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
const ForumSection = memo(function ForumSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Форум" title="Последние темы"/>
      <ul className={styles.forumList}>
        {MOCK_FORUM_TOPICS.slice(0, FORUM_TOPICS_PREVIEW_COUNT).map((topic) => (<li key={topic.id}>
            <Link to={forumTopicPath(topic.id)} className={styles.forumItem}>
              <span className={styles.forumTitle}>
                {topic.isPinned && '📌 '}
                {topic.title}
              </span>
              <span className={styles.forumMeta}>
                {topic.authorName} · {topic.postsCount} ответов ·{' '}
                {format(new Date(topic.lastPostAt), 'd MMM', { locale: ru })}
              </span>
            </Link>
          </li>))}
      </ul>
      <Link to={ROUTES.FORUM} className={styles.moreLink}>
        Все темы форума →
      </Link>
    </div>);
});

export {
  ForumSection,
}
