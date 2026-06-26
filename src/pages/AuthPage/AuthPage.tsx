import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setUser } from '@/features/user/userSlice'
import { selectAuthLoading, selectIsAuthenticated } from '@/features/user/userSelectors'
import {
  loginRequest,
  resetPasswordRequest,
  saveAuthToken,
  fetchOAuthStatus,
  fetchCaptchaConfig,
  sendRecoveryCode,
  sendRegistrationCode,
  verifyRegistrationCode,
  type OAuthStatus,
  type VerificationChannel,
} from '@/services/authApi'
import { ensurePushNotifications } from '@/services/pushApi'
import { resolveOAuthApiBase } from '@/utils/oauthApiBase'
import { openOAuthUrl } from '@/utils/nativeNavigation'
import { isNativeApp } from '@/utils/nativeApp'
import { completeOAuthLogin } from '@/services/completeOAuthLogin'
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget/RecaptchaWidget'
import { GoogleLogo, VkLogo } from '@/components/auth/OAuthLogoButton/OAuthLogos'
import { ROUTES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errorMessage'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { Button } from '@/components/ui/Button/Button'
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen/AppLoadingScreen'
import { ECHO_FORM_ACTION } from '@/constants/forms'
import { VALIDATION } from '@/constants/validation'
import { requestLocationPromptAfterAuth } from '@/constants/user-location'
import { RegisterLegalAgreement } from '@/components/legal/RegisterLegalAgreement/RegisterLegalAgreement'
import pageStyles from '@/styles/page.module.css'
import styles from './AuthPage.module.css'

enum AuthTab {
  Login = 'login',
  Register = 'register',
  Recovery = 'recovery',
}

enum RegisterStep {
  Form = 'form',
  Code = 'code',
}

enum RecoveryStep {
  Form = 'form',
  Code = 'code',
}

const RESEND_COOLDOWN_SEC = 60

const loginSchema = z.object({
  user: z.string().email('Введите корректный email'),
  password: z
    .string()
    .min(VALIDATION.MIN_PASSWORD_LENGTH, `Минимум ${VALIDATION.MIN_PASSWORD_LENGTH} символов`),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH, 'Укажите имя'),
  phone: z.string().min(VALIDATION.MIN_PHONE_LENGTH, 'Укажите телефон'),
})

const recoverySchema = z.object({
  email: z.string().email('Введите корректный email'),
})

const recoveryResetSchema = z.object({
  code: z.string().length(6, 'Код состоит из 6 цифр'),
  password: z
    .string()
    .min(VALIDATION.MIN_PASSWORD_LENGTH, `Минимум ${VALIDATION.MIN_PASSWORD_LENGTH} символов`),
})

const codeSchema = z.object({
  code: z.string().length(6, 'Код состоит из 6 цифр'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type RecoveryForm = z.infer<typeof recoverySchema>
type RecoveryResetForm = z.infer<typeof recoveryResetSchema>
type CodeForm = z.infer<typeof codeSchema>

function resolveAuthTab(tab: string | null): AuthTab {
  if (tab === 'register') return AuthTab.Register
  if (tab === 'recovery') return AuthTab.Recovery
  return AuthTab.Login
}

function AuthPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAuthLoading = useAppSelector(selectAuthLoading)
  const returnPath = useMemo(() => {
    const from = searchParams.get('from')
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      return from
    }
    return ROUTES.PROFILE
  }, [searchParams])
  const [activeTab, setActiveTab] = useState<AuthTab>(() => resolveAuthTab(searchParams.get('tab')))
  const [registerStep, setRegisterStep] = useState<RegisterStep>(RegisterStep.Form)
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>(RecoveryStep.Form)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const verificationChannel: VerificationChannel = 'email'
  const [verificationTarget, setVerificationTarget] = useState('')
  const [pendingRegisterData, setPendingRegisterData] = useState<RegisterForm | null>(null)
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isSendingRecovery, setIsSendingRecovery] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaSiteKey, setCaptchaSiteKey] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const hasOAuthReturn = useMemo(() => {
    const oauthError = searchParams.get('oauth_error')
    const handoff = searchParams.get('handoff')
    const oauthCode = searchParams.get('code')
    const oauth = searchParams.get('oauth')
    return Boolean(oauthError || handoff || (oauth === '1' && oauthCode))
  }, [searchParams])
  const [isCompletingOAuth, setIsCompletingOAuth] = useState(hasOAuthReturn)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectAttemptedRef = useRef(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const recoveryForm = useForm<RecoveryForm>({ resolver: zodResolver(recoverySchema) })
  const recoveryResetForm = useForm<RecoveryResetForm>({ resolver: zodResolver(recoveryResetSchema) })
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })

  useEffect(() => {
    if (resendSeconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  useEffect(() => {
    void fetchCaptchaConfig()
      .then((config) => {
        setCaptchaRequired(config.required);
        setCaptchaSiteKey(config.siteKey);
      })
      .catch(() => {
        setCaptchaRequired(false);
        setCaptchaSiteKey(null);
      });
  }, []);

  useEffect(() => {
    void fetchOAuthStatus()
      .then((status) => setOauthStatus(status))
      .catch(() => setOauthStatus({
        google: false,
        vk: false,
        vkAppId: null,
        siteUrl: 'https://nagaevomaster.ru',
        googleCallback: 'https://nagaevomaster.ru/api/auth/google/callback',
        vkCallback: 'https://nagaevomaster.ru/api/auth/vk/callback',
      }))
  }, [])

  const redirectAfterAuth = useCallback(() => {
    if (redirectAttemptedRef.current) return
    redirectAttemptedRef.current = true
    setIsRedirecting(true)
    navigate(returnPath, { replace: true })
    window.setTimeout(() => {
      const path = window.location.pathname
      if (path === '/auth' || path.endsWith('/auth')) {
        const target = returnPath.startsWith('/')
          ? `${window.location.origin}${returnPath}`
          : returnPath
        window.location.replace(target)
        return
      }
      setIsRedirecting(false)
    }, 350)
  }, [navigate, returnPath])

  useEffect(() => {
    if (!isAuthenticated) {
      redirectAttemptedRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading || isCompletingOAuth || isRedirecting) return
    redirectAfterAuth()
  }, [isAuthenticated, isAuthLoading, isCompletingOAuth, isRedirecting, redirectAfterAuth])

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error')
    const handoff = searchParams.get('handoff')
    const oauthCode = searchParams.get('code')
    const oauth = searchParams.get('oauth')

    if (oauthError) {
      toast.error(decodeURIComponent(oauthError))
      setIsCompletingOAuth(false)
      navigate(ROUTES.AUTH, { replace: true })
      return
    }

    if (!handoff && (oauth !== '1' || !oauthCode)) {
      setIsCompletingOAuth(false)
      return
    }

    setIsCompletingOAuth(true)
    let cancelled = false

    void completeOAuthLogin(`?${searchParams.toString()}`).then((result) => {
      if (cancelled) return
      if (result.status === 'success') {
        redirectAfterAuth()
        return
      }
      if (result.status === 'error') {
        toast.error(result.message)
        navigate(ROUTES.AUTH, { replace: true })
        return
      }
      setIsCompletingOAuth(false)
    })

    return () => {
      cancelled = true
    }
  }, [navigate, redirectAfterAuth, returnPath, searchParams])

  useEffect(() => {
    setActiveTab(resolveAuthTab(searchParams.get('tab')))
  }, [searchParams])

  const apiBase = resolveOAuthApiBase()
  const googleAuthUrl = `${apiBase}/auth/google`
  const vkAuthUrl = `${apiBase}/auth/vk`
  const vkEnabled = Boolean(oauthStatus?.vk)
  const oauthEnabled = Boolean(oauthStatus?.google || vkEnabled)
  const showWebOAuth = !isNativeApp()

  const goAfterAuth = () => {
    redirectAfterAuth()
  }

  const oauthButtons = oauthStatus && oauthEnabled ? (
    <div className={styles.oauthRow}>
      {showWebOAuth && oauthStatus.google && (
        <button
          type="button"
          className={styles.oauthLogoBtn}
          aria-label="Войти через Google"
          onClick={() => void openOAuthUrl(googleAuthUrl)}
        >
          <GoogleLogo />
        </button>
      )}
      {vkEnabled && (
        <button
          type="button"
          className={styles.oauthLogoBtn}
          aria-label="Войти через ВКонтакте"
          onClick={() => void openOAuthUrl(vkAuthUrl)}
        >
          <VkLogo />
        </button>
      )}
    </div>
  ) : null

  const oauthBlock = oauthButtons ? (
    <>
      {oauthButtons}
      <p className={styles.oauthHint}>или войдите по email и паролю</p>
    </>
  ) : null

  const oauthRegisterBlock = oauthButtons ? (
    <>
      {oauthButtons}
      <p className={styles.oauthHint}>или зарегистрируйтесь по email</p>
    </>
  ) : null

  if (isAuthLoading || isCompletingOAuth || isRedirecting) {
    const label = isCompletingOAuth
      ? 'Завершаем вход…'
      : isAuthLoading
        ? 'Проверяем сессию…'
        : 'Переход в профиль…'
    return <AppLoadingScreen label={label} />
  }

  const resetRegisterFlow = () => {
    setRegisterStep(RegisterStep.Form)
    setVerificationTarget('')
    setPendingRegisterData(null)
    setResendSeconds(0)
    codeForm.reset()
  }

  const handleLoginTabClick = () => setActiveTab(AuthTab.Login)
  const handleRegisterTabClick = () => {
    setActiveTab(AuthTab.Register)
    resetRegisterFlow()
  }
  const handleRecoveryTabClick = () => {
    setActiveTab(AuthTab.Recovery)
    setRecoveryStep(RecoveryStep.Form)
    setRecoveryEmail('')
    recoveryResetForm.reset()
  }

  const handleLogin = async (data: LoginForm) => {
    if (captchaRequired && !captchaToken) {
      toast.error('Подтвердите, что вы не робот')
      return
    }
    setIsLoggingIn(true)
    try {
      const response = await loginRequest(
        data.user,
        data.password,
        rememberDevice,
        captchaToken ?? undefined,
      )
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      void ensurePushNotifications({ requestPermission: true })
      toast.success(`Добро пожаловать, ${response.user.name}!`)
      goAfterAuth()
    } catch (error) {
      setCaptchaToken(null)
      setCaptchaResetKey((value) => value + 1)
      toast.error(getErrorMessage(error, 'Ошибка входа'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSendCode = async (data: RegisterForm) => {
    if (!legalAccepted) {
      toast.error('Подтвердите согласие с документами')
      return
    }
    setIsSendingCode(true)
    try {
      const response = await sendRegistrationCode(verificationChannel, data)
      setPendingRegisterData(data)
      setVerificationTarget(response.target)
      setRegisterStep(RegisterStep.Code)
      setResendSeconds(RESEND_COOLDOWN_SEC)
      codeForm.reset()
      toast.success(response.message)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить код'))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async (data: CodeForm) => {
    if (!pendingRegisterData) {
      toast.error('Сначала заполните форму регистрации')
      setRegisterStep(RegisterStep.Form)
      return
    }

    setIsVerifyingCode(true)
    try {
      const response = await verifyRegistrationCode(
        verificationChannel,
        verificationTarget,
        data.code,
      )
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      void ensurePushNotifications({ requestPermission: true })
      requestLocationPromptAfterAuth()
      resetRegisterFlow()
      toast.success('Регистрация подтверждена')
      goAfterAuth()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Неверный код'))
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleResendCode = async () => {
    if (!pendingRegisterData || resendSeconds > 0) return
    await handleSendCode(pendingRegisterData)
  }

  const handleRecoverySendCode = async (data: RecoveryForm) => {
    setIsSendingRecovery(true)
    try {
      const response = await sendRecoveryCode(data.email)
      setRecoveryEmail(data.email.trim().toLowerCase())
      setRecoveryStep(RecoveryStep.Code)
      setResendSeconds(RESEND_COOLDOWN_SEC)
      recoveryResetForm.reset()
      toast.success(response.message)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить код'))
    } finally {
      setIsSendingRecovery(false)
    }
  }

  const handleRecoveryReset = async (data: RecoveryResetForm) => {
    if (!recoveryEmail) {
      setRecoveryStep(RecoveryStep.Form)
      return
    }
    setIsResettingPassword(true)
    try {
      const response = await resetPasswordRequest(recoveryEmail, data.code, data.password)
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      void ensurePushNotifications({ requestPermission: true })
      setRecoveryStep(RecoveryStep.Form)
      setRecoveryEmail('')
      recoveryForm.reset()
      recoveryResetForm.reset()
      toast.success('Пароль обновлён, вы вошли в аккаунт')
      goAfterAuth()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сменить пароль'))
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleResendRecoveryCode = async () => {
    if (!recoveryEmail || resendSeconds > 0) return
    setIsSendingRecovery(true)
    try {
      const response = await sendRecoveryCode(recoveryEmail)
      setResendSeconds(RESEND_COOLDOWN_SEC)
      toast.success(response.message)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить код'))
    } finally {
      setIsSendingRecovery(false)
    }
  }

  const verificationHint = `Код отправлен на ${verificationTarget}`

  return (
    <>
      <PageMeta title="Вход и регистрация" canonical="/auth" robots="noindex, nofollow" />

      <div className={`${pageStyles.page} ${styles.page}`}>
        <div className={`container ${styles.container}`}>
          <div className={`${styles.shell} ${activeTab === AuthTab.Register ? styles.shellRegister : ''}`}>
            <PageHeader badge="Аккаунт" title="Вход и регистрация" />
            {activeTab !== AuthTab.Register && (
              <p className={styles.lead}>
                Зарегистрируйтесь, чтобы пользоваться услугами, поиском и форумом деревни Нагаево
              </p>
            )}

          <div className={styles.tabs} role="tablist" aria-label="Формы авторизации">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === AuthTab.Login}
              className={activeTab === AuthTab.Login ? styles.tabActive : styles.tab}
              onClick={handleLoginTabClick}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === AuthTab.Register}
              className={activeTab === AuthTab.Register ? styles.tabActive : styles.tab}
              onClick={handleRegisterTabClick}
            >
              Регистрация
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === AuthTab.Recovery}
              className={activeTab === AuthTab.Recovery ? styles.tabActive : styles.tab}
              onClick={handleRecoveryTabClick}
            >
              Восстановление
            </button>
          </div>

          {activeTab === AuthTab.Login && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="login">
              <h2 className={styles.cardTitle}>Вход в аккаунт</h2>
              {oauthBlock}
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={loginForm.handleSubmit(handleLogin)}
                noValidate
              >
                <div className={styles.field}>
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={pageStyles.input}
                    {...loginForm.register('user')}
                  />
                  {loginForm.formState.errors.user && (
                    <span className={pageStyles.formError}>
                      {loginForm.formState.errors.user.message}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="login-password">Пароль</label>
                  <PasswordInput
                    id="login-password"
                    required
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <span className={pageStyles.formError}>
                      {loginForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <label className={styles.rememberRow}>
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(event) => setRememberDevice(event.target.checked)}
                  />
                  <span>Запомнить это устройство</span>
                </label>

                {captchaRequired && captchaSiteKey && (
                  <RecaptchaWidget
                    key={captchaResetKey}
                    siteKey={captchaSiteKey}
                    onChange={setCaptchaToken}
                  />
                )}

                <Button type="submit" fullWidth loading={isLoggingIn}>
                  Войти
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Register && registerStep === RegisterStep.Form && (
            <section className={`${styles.card} ${styles.tabPanel} ${styles.registerCard}`} key="register-form">
              <div className={styles.registerHero}>
                <p className={styles.registerStep}>Шаг 1 из 2</p>
                <h2 className={styles.registerTitle}>Новый аккаунт</h2>
              </div>

              <p className={styles.emailNote}>
                Подтверждение по email
                <span className={styles.smsMuted}> · SMS пока в разработке</span>
              </p>

              {oauthRegisterBlock}

              <form
                className={`${styles.form} ${styles.registerForm}`}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={registerForm.handleSubmit(handleSendCode)}
                noValidate
              >
                <div className={styles.field}>
                  <label htmlFor="register-name">Имя</label>
                  <input
                    id="register-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Как к вам обращаться"
                    className={pageStyles.input}
                    {...registerForm.register('name')}
                  />
                  {registerForm.formState.errors.name && (
                    <span className={pageStyles.formError}>
                      {registerForm.formState.errors.name.message}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={pageStyles.input}
                    {...registerForm.register('user')}
                  />
                  {registerForm.formState.errors.user && (
                    <span className={pageStyles.formError}>
                      {registerForm.formState.errors.user.message}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="register-phone">Телефон</label>
                  <input
                    id="register-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+7 (900) 000-00-00"
                    className={pageStyles.input}
                    {...registerForm.register('phone')}
                  />
                  {registerForm.formState.errors.phone && (
                    <span className={pageStyles.formError}>
                      {registerForm.formState.errors.phone.message}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="register-password">Пароль</label>
                  <PasswordInput
                    id="register-password"
                    required
                    autoComplete="new-password"
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <span className={pageStyles.formError}>
                      {registerForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <RegisterLegalAgreement checked={legalAccepted} onChange={setLegalAccepted} />

                <Button type="submit" fullWidth variant="secondary" loading={isSendingCode} disabled={!legalAccepted}>
                  Получить код
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Register && registerStep === RegisterStep.Code && (
            <section className={`${styles.card} ${styles.tabPanel} ${styles.registerCard}`} key="register-code">
              <div className={styles.registerHero}>
                <p className={styles.registerStep}>Шаг 2 из 2</p>
                <h2 className={styles.registerTitle}>Код из письма</h2>
              </div>
              <p className={styles.emailNote}>{verificationHint}</p>

              <form
                className={`${styles.form} ${styles.registerForm}`}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={codeForm.handleSubmit(handleVerifyCode)}
                noValidate
              >
                <div className={styles.field}>
                  <label htmlFor="register-code">Код из письма</label>
                  <input
                    id="register-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className={`${pageStyles.input} ${styles.codeInput}`}
                    {...codeForm.register('code')}
                  />
                  {codeForm.formState.errors.code && (
                    <span className={pageStyles.formError}>
                      {codeForm.formState.errors.code.message}
                    </span>
                  )}
                </div>

                <Button type="submit" fullWidth loading={isVerifyingCode}>
                  Подтвердить и зарегистрироваться
                </Button>

                <div className={styles.secondaryActions}>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={resendSeconds > 0 || isSendingCode}
                    onClick={handleResendCode}
                  >
                    {resendSeconds > 0 ? `Отправить снова через ${resendSeconds} с` : 'Отправить код снова'}
                  </button>
                  <button type="button" className={styles.textButton} onClick={resetRegisterFlow}>
                    Изменить данные
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Recovery && recoveryStep === RecoveryStep.Form && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="recovery-form">
              <h2 className="titleSection">Восстановление пароля</h2>
              <p className={styles.hint}>Код придёт на email, если аккаунт зарегистрирован</p>
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={recoveryForm.handleSubmit(handleRecoverySendCode)}
                noValidate
              >
                <label htmlFor="recovery-email">Email</label>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={pageStyles.input}
                  {...recoveryForm.register('email')}
                />
                {recoveryForm.formState.errors.email && (
                  <span className={pageStyles.formError}>
                    {recoveryForm.formState.errors.email.message}
                  </span>
                )}

                <Button type="submit" fullWidth loading={isSendingRecovery}>
                  Получить код
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Recovery && recoveryStep === RecoveryStep.Code && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="recovery-code">
              <h2 className="titleSection">Новый пароль</h2>
              <p className={styles.hint}>Код отправлен на {recoveryEmail}</p>
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={recoveryResetForm.handleSubmit(handleRecoveryReset)}
                noValidate
              >
                <label htmlFor="recovery-code">Код из письма</label>
                <input
                  id="recovery-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className={`${pageStyles.input} ${styles.codeInput}`}
                  {...recoveryResetForm.register('code')}
                />
                {recoveryResetForm.formState.errors.code && (
                  <span className={pageStyles.formError}>
                    {recoveryResetForm.formState.errors.code.message}
                  </span>
                )}

                <label htmlFor="recovery-password">Новый пароль</label>
                <PasswordInput
                  id="recovery-password"
                  required
                  autoComplete="new-password"
                  {...recoveryResetForm.register('password')}
                />
                {recoveryResetForm.formState.errors.password && (
                  <span className={pageStyles.formError}>
                    {recoveryResetForm.formState.errors.password.message}
                  </span>
                )}

                <Button type="submit" fullWidth loading={isResettingPassword}>
                  Сохранить пароль и войти
                </Button>

                <div className={styles.secondaryActions}>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={resendSeconds > 0 || isSendingRecovery}
                    onClick={() => void handleResendRecoveryCode()}
                  >
                    {resendSeconds > 0 ? `Отправить снова через ${resendSeconds} с` : 'Отправить код снова'}
                  </button>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => setRecoveryStep(RecoveryStep.Form)}
                  >
                    Изменить email
                  </button>
                </div>
              </form>
            </section>
          )}
          </div>
        </div>
      </div>
    </>
  )
}

export {
  AuthPage,
}
