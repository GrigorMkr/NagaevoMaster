import type { ReactNode } from 'react';
import { CircularStatRing } from '@/components/ui/CircularStatRing/CircularStatRing';
import type { AdminDashboardStats } from '@/services/moderationApi';
import styles from './AdminDashboardOverview.module.css';

interface SectionProps {
  title: string;
  children: ReactNode;
}

function StatSection({ title, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

interface AdminDashboardOverviewProps {
  stats: AdminDashboardStats;
}

function AdminDashboardOverview({ stats }: AdminDashboardOverviewProps) {
  const { listings, users } = stats;

  return (
    <div className={styles.root}>
      <StatSection title="Сейчас на сайте">
        <CircularStatRing
          label="Всего в сети"
          value={stats.presence.totalOnline}
          max={Math.max(users.total, 1)}
          accent="gold"
        />
        <CircularStatRing
          label="Зарегистрированные"
          value={stats.presence.usersOnline}
          max={Math.max(stats.presence.totalOnline, 1)}
          hint="онлайн"
        />
        <CircularStatRing
          label="Гости"
          value={stats.presence.guestsOnline}
          max={Math.max(stats.presence.totalOnline, 1)}
          hint="без входа"
          accent="blue"
        />
      </StatSection>

      <StatSection title="Пользователи">
        <CircularStatRing
          label="Всего"
          value={users.total}
          max={users.total}
          showPercent={false}
        />
        <CircularStatRing
          label="Онлайн"
          value={users.online}
          max={Math.max(users.total, 1)}
          hint="сейчас в сети"
        />
        <CircularStatRing
          label="Офлайн"
          value={users.offline}
          max={Math.max(users.total, 1)}
          hint="не в сети"
          accent="muted"
        />
        <CircularStatRing
          label="Новых сегодня"
          value={users.registeredToday}
          max={Math.max(users.total, 1)}
          accent="gold"
        />
        <CircularStatRing
          label="Заблокированы"
          value={users.banned}
          max={Math.max(users.total, 1)}
          accent="coral"
        />
      </StatSection>

      <StatSection title="Объявления">
        <CircularStatRing
          label="Опубликовано"
          value={listings.published}
          max={Math.max(listings.total, 1)}
        />
        <CircularStatRing
          label="Услуги"
          value={listings.servicesPublished}
          max={Math.max(listings.published, 1)}
        />
        <CircularStatRing
          label="Доска"
          value={listings.boardPublished}
          max={Math.max(listings.published, 1)}
          hint="продажа · работа · потеряшки"
        />
        <CircularStatRing
          label="Добавлено сегодня"
          value={listings.addedToday}
          max={Math.max(listings.total, 1)}
          accent="gold"
        />
        <CircularStatRing
          label="Услуг сегодня"
          value={listings.addedTodayServices}
          max={Math.max(listings.addedToday, 1)}
          accent="muted"
        />
        <CircularStatRing
          label="Доски сегодня"
          value={listings.addedTodayBoard}
          max={Math.max(listings.addedToday, 1)}
          accent="muted"
        />
        <CircularStatRing
          label="На модерации"
          value={listings.pending}
          max={Math.max(listings.total, 1)}
          accent="coral"
        />
        <CircularStatRing
          label="Отклонено"
          value={listings.rejected}
          max={Math.max(listings.total, 1)}
          accent="muted"
        />
      </StatSection>

      <StatSection title="Доска по разделам">
        <CircularStatRing
          label="Продажа"
          value={listings.boardSalePublished}
          max={Math.max(listings.boardPublished, 1)}
        />
        <CircularStatRing
          label="Вакансии"
          value={listings.boardVacancyPublished}
          max={Math.max(listings.boardPublished, 1)}
          accent="blue"
        />
        <CircularStatRing
          label="Потеряшки"
          value={listings.boardLostPublished}
          max={Math.max(listings.boardPublished, 1)}
          accent="coral"
        />
      </StatSection>

      <StatSection title="Активность">
        <CircularStatRing
          label="Диалогов"
          value={stats.messages.conversations}
          max={Math.max(users.total, 1)}
        />
        <CircularStatRing
          label="Сообщений сегодня"
          value={stats.messages.today}
          max={Math.max(stats.messages.total, 1)}
          accent="gold"
        />
        <CircularStatRing
          label="Тем форума"
          value={stats.forum.topics}
          max={Math.max(stats.forum.topics + stats.forum.postsToday, 1)}
          showPercent={false}
        />
        <CircularStatRing
          label="Ответов сегодня"
          value={stats.forum.postsToday}
          max={Math.max(stats.forum.topics, 1)}
          accent="blue"
        />
        <CircularStatRing
          label="Друзей (пары)"
          value={stats.social.friendships}
          max={Math.max(users.total, 1)}
        />
        <CircularStatRing
          label="Заявок в друзья"
          value={stats.social.pendingFriendRequests}
          max={Math.max(stats.social.friendships + stats.social.pendingFriendRequests, 1)}
          accent="gold"
        />
        <CircularStatRing
          label="Отзывов"
          value={stats.reviews.total}
          max={Math.max(listings.published, 1)}
          accent="muted"
        />
        <CircularStatRing
          label="Обращений сегодня"
          value={stats.contact.messagesToday}
          max={Math.max(stats.contact.messagesToday + stats.reviews.total, 1)}
          accent="muted"
        />
      </StatSection>

      <StatSection title="Требует внимания">
        <CircularStatRing
          label="Жалобы"
          value={stats.moderation.reportsPending}
          max={Math.max(stats.moderation.reportsPending + listings.published, 1)}
          accent="coral"
        />
        <CircularStatRing
          label="Очередь модерации"
          value={stats.moderation.listingsPending}
          max={Math.max(listings.total, 1)}
          accent="gold"
        />
      </StatSection>

      <p className={styles.updated}>
        Обновлено:
        {' '}
        {new Date(stats.generatedAt).toLocaleString('ru-RU')}
      </p>
    </div>
  );
}

export {
  AdminDashboardOverview,
  StatSection,
};
