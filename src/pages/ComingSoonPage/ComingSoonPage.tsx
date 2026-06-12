import { useMemo, useState, type FormEvent } from 'react'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Logo } from '@/components/ui/Logo/Logo'
import { Button } from '@/components/ui/Button/Button'
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput'
import { COMING_SOON_COPY, grantPreviewAccess } from '@/utils/siteAccess'
import styles from './ComingSoonPage.module.css'

interface ComingSoonPageProps {
  onAccessGranted: () => void
}

export function ComingSoonPage({ onAccessGranted }: ComingSoonPageProps) {
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')

  const previewLink = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('preview', import.meta.env.VITE_PREVIEW_ACCESS_KEY ?? 'nagaevo-preview')
    const query = params.toString()
    return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (grantPreviewAccess(accessKey)) {
      setError('')
      onAccessGranted()
      return
    }
    setError('Неверный ключ. Нужен ключ команды, не пароль от аккаунта.')
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
              <p className={styles.teamHint}>
                Ключ команды: <strong>nagaevo-preview</strong>
                <br />
                Это не пароль от страницы «Вход». Его вводят здесь, на заглушке.
              </p>

              <label className={styles.teamLabel} htmlFor="preview-access-key">
                Ключ доступа
              </label>
              <PasswordInput
                id="preview-access-key"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder="nagaevo-preview"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {error && <p className={styles.teamError}>{error}</p>}
              <Button type="submit" fullWidth>
                Открыть сайт
              </Button>

              <a className={styles.teamLink} href={previewLink}>
                Или открыть по секретной ссылке
              </a>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
