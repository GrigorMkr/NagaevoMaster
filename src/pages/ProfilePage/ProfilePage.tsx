import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { Button } from '@/components/ui/Button/Button'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { useAccountLocation } from '@/hooks/useAccountLocation'
import { ROUTES } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ProfilePage.module.css'

const sections = [
  { title: 'Мои объявления', desc: 'CRUD — создание, редактирование, удаление' },
  { title: 'Мои отзывы', desc: 'Написать и ответить на отзывы' },
  { title: 'Избранное', desc: 'Сохранённые услуги' },
  { title: 'Настройки профиля', desc: 'Аватар, телефон, email' },
  { title: 'История просмотров', desc: 'Недавно открытые карточки' },
  { title: 'Уведомления', desc: 'Ответы на форуме и модерация' },
]

export function ProfilePage() {
  const { accountLocation, isLocating, detectLocation, resetLocation } = useAccountLocation()

  return (
    <>
      <PageMeta title="Личный кабинет" canonical="/profile" />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader
            badge="Профиль"
            title="Личный кабинет"
            subtitle="Управление объявлениями и настройками"
          />

          <section className={styles.locationCard} aria-label="Местоположение аккаунта">
            <h2 className={styles.locationTitle}>Текущее местоположение</h2>
            {accountLocation ? (
              <p className={styles.locationText}>
                {accountLocation.label}: {accountLocation.lat.toFixed(5)}, {accountLocation.lng.toFixed(5)}
              </p>
            ) : (
              <p className={styles.locationText}>
                Местоположение не задано. Оно нужно для поиска ближайших услуг на карте.
              </p>
            )}
            <div className={styles.locationActions}>
              <Button type="button" onClick={detectLocation} loading={isLocating}>
                Определить местоположение
              </Button>
              {accountLocation && (
                <Button type="button" variant="outline" onClick={resetLocation}>
                  Сбросить
                </Button>
              )}
            </div>
          </section>

          <div className={styles.actions}>
            <ButtonLink to={ROUTES.ADD_LISTING}>Добавить объявление</ButtonLink>
            <ButtonLink to={ROUTES.AUTH} variant="outline">Войти</ButtonLink>
          </div>

          <div className={styles.grid}>
            {sections.map((section) => (
              <article key={section.title} className={styles.card}>
                <h3>{section.title}</h3>
                <p>{section.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
