import { useState, type FormEvent } from 'react'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Logo } from '@/components/ui/Logo/Logo'
import { Button } from '@/components/ui/Button/Button'
import { COMING_SOON_COPY, grantPreviewAccess } from '@/utils/siteAccess'
import pageStyles from '@/styles/page.module.css'
import styles from './ComingSoonPage.module.css'

interface ComingSoonPageProps {
  onAccessGranted: () => void
}

export function ComingSoonPage({ onAccessGranted }: ComingSoonPageProps) {
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (grantPreviewAccess(accessKey)) {
      setError('')
      onAccessGranted()
      return
    }
    setError('Неверный ключ доступа')
  }

  return (
    <>
      <PageMeta
        title="Скоро запуск"
        description="NagaevoMaster скоро откроется для жителей посёлка Нагаево."
        canonical="/"
      />

      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <Logo />
          </div>

          <span className={styles.badge}>Скоро запуск</span>
          <h1 className={styles.title}>{COMING_SOON_COPY.title}</h1>
          <p className={styles.subtitle}>{COMING_SOON_COPY.subtitle}</p>
          <p className={styles.hint}>{COMING_SOON_COPY.hint}</p>

          <a className={styles.contact} href={`mailto:${COMING_SOON_COPY.contactLabel}`}>
            {COMING_SOON_COPY.contactLabel}
          </a>

          <button
            type="button"
            className={styles.teamToggle}
            onClick={() => setShowTeamForm((current) => !current)}
          >
            Вход для команды
          </button>

          {showTeamForm && (
            <form className={styles.teamForm} onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="preview-access-key">
                Ключ доступа
              </label>
              <input
                id="preview-access-key"
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder="Ключ доступа"
                className={pageStyles.input}
                autoComplete="off"
              />
              {error && <p className={styles.teamError}>{error}</p>}
              <Button type="submit" fullWidth>
                Открыть сайт
              </Button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
