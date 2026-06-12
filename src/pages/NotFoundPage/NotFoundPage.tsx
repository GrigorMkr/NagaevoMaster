import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { ROUTES } from '@/utils/constants'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Страница не найдена" />

      <div className={styles.page}>
        <div className="container">
          <div className={styles.content}>
            <span className={styles.code}>404</span>
            <h1>Страница не найдена</h1>
            <p>Возможно, она была перемещена или вы ввели неверный адрес.</p>
            <ButtonLink to={ROUTES.HOME} size="lg">
              На главную
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}
