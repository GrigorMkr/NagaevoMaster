import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
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
