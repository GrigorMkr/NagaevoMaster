import { useEffect, useRef } from 'react'
import * as VKID from '@vkid/sdk'
import { completeVkLogin } from '@/services/authApi'
import styles from './VkIdLogin.module.css'

function randomOAuthString(): string {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

interface VkIdLoginProps {
  appId: string
  redirectUrl: string
  onAuthenticated: (token: string) => void
  onError: (message: string) => void
}

export function VkIdLogin({
  appId,
  redirectUrl,
  onAuthenticated,
  onError,
}: VkIdLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthenticatedRef = useRef(onAuthenticated)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated
    onErrorRef.current = onError
  }, [onAuthenticated, onError])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !appId) return undefined

    const state = randomOAuthString()
    const codeVerifier = randomOAuthString()

    VKID.Config.init({
      app: Number(appId),
      redirectUrl,
      state,
      codeVerifier,
      scope: 'email',
      responseMode: VKID.ConfigResponseMode.Callback,
    })

    const oneTap = new VKID.OneTap()
    oneTap
      .render({
        container,
        showAlternativeLogin: true,
        scheme: VKID.Scheme.DARK,
        lang: VKID.Languages.RUS,
      })
      .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
        onErrorRef.current(error instanceof Error ? error.message : 'Ошибка VK ID')
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: { code: string; device_id: string }) => {
        void VKID.Auth.exchangeCode(payload.code, payload.device_id, codeVerifier)
          .then((result) => completeVkLogin(result.access_token))
          .then((auth) => onAuthenticatedRef.current(auth.token))
          .catch((error: unknown) => {
            onErrorRef.current(error instanceof Error ? error.message : 'Не удалось войти через VK')
          })
      })

    return () => {
      container.replaceChildren()
    }
  }, [appId, redirectUrl])

  return <div ref={containerRef} className={styles.vkWidget} />
}
