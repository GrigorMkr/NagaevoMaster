import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setUser } from '@/features/user/userSlice'
import { selectAuthLoading, selectIsAuthenticated } from '@/features/user/userSelectors'
import {
  loginRequest,
  recoveryRequest,
  saveAuthToken,
  sendRegistrationCode,
  verifyRegistrationCode,
  type VerificationChannel,
} from '@/services/authApi'
import { ROUTES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errorMessage'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { Button } from '@/components/ui/Button/Button'
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { ECHO_FORM_ACTION } from '@/constants/forms'
import { VALIDATION } from '@/constants/validation'
import { requestLocationPromptAfterAuth } from '@/constants/user-location'
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

const codeSchema = z.object({
  code: z.string().length(6, 'Код состоит из 6 цифр'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type RecoveryForm = z.infer<typeof recoverySchema>
type CodeForm = z.infer<typeof codeSchema>

function AuthPage() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAuthLoading = useAppSelector(selectAuthLoading)
  const [activeTab, setActiveTab] = useState<AuthTab>(AuthTab.Login)
  const [registerStep, setRegisterStep] = useState<RegisterStep>(RegisterStep.Form)
  const [verificationChannel, setVerificationChannel] = useState<VerificationChannel>('email')
  const [verificationTarget, setVerificationTarget] = useState('')
  const [pendingRegisterData, setPendingRegisterData] = useState<RegisterForm | null>(null)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const recoveryForm = useForm<RecoveryForm>({ resolver: zodResolver(recoverySchema) })
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })

  useEffect(() => {
    if (resendSeconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  if (isAuthLoading) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <Spinner />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.PROFILE} replace />
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
  const handleRecoveryTabClick = () => setActiveTab(AuthTab.Recovery)

  const handleLogin = async (data: LoginForm) => {
    try {
      const response = await loginRequest(data.user, data.password)
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      requestLocationPromptAfterAuth()
      toast.success(`Добро пожаловать, ${response.user.name}!`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка входа'))
    }
  }

  const handleSendCode = async (data: RegisterForm) => {
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
      requestLocationPromptAfterAuth()
      resetRegisterFlow()
      toast.success('Регистрация подтверждена')
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

  const handleRecovery = async (data: RecoveryForm) => {
    try {
      await recoveryRequest(data.email)
      toast.success(`Если email зарегистрирован, инструкция отправлена на ${data.email}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка восстановления'))
    }
  }

  const verificationHint = verificationChannel === 'email'
    ? `Код отправлен на ${verificationTarget}`
    : `Код отправлен на ${verificationTarget}`

  return (
    <>
      <PageMeta title="Вход и регистрация" canonical="/auth" />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Аккаунт" title="Вход и регистрация" />

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
              <h2 className="titleSection">Вход</h2>
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={loginForm.handleSubmit(handleLogin)}
                noValidate
              >
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={pageStyles.input}
                  {...loginForm.register('user')}
                />
                {loginForm.formState.errors.user && (
                  <span className={pageStyles.formError}>
                    {loginForm.formState.errors.user.message}
                  </span>
                )}

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

                <Button type="submit" fullWidth>
                  Войти
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Register && registerStep === RegisterStep.Form && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="register-form">
              <h2 className="titleSection">Регистрация</h2>
              <p className={styles.hint}>
                Подтвердите аккаунт кодом из email или SMS — без этого вход будет недоступен.
              </p>

              <div className={styles.channelGroup} role="radiogroup" aria-label="Способ подтверждения">
                <label className={verificationChannel === 'email' ? styles.channelActive : styles.channel}>
                  <input
                    type="radio"
                    name="verification-channel"
                    value="email"
                    checked={verificationChannel === 'email'}
                    onChange={() => setVerificationChannel('email')}
                  />
                  <span>Подтвердить email</span>
                </label>
                <label className={verificationChannel === 'sms' ? styles.channelActive : styles.channel}>
                  <input
                    type="radio"
                    name="verification-channel"
                    value="sms"
                    checked={verificationChannel === 'sms'}
                    onChange={() => setVerificationChannel('sms')}
                  />
                  <span>Подтвердить телефон (SMS)</span>
                </label>
              </div>

              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={registerForm.handleSubmit(handleSendCode)}
                noValidate
              >
                <label htmlFor="register-name">Имя</label>
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  className={pageStyles.input}
                  {...registerForm.register('name')}
                />
                {registerForm.formState.errors.name && (
                  <span className={pageStyles.formError}>
                    {registerForm.formState.errors.name.message}
                  </span>
                )}

                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={pageStyles.input}
                  {...registerForm.register('user')}
                />
                {registerForm.formState.errors.user && (
                  <span className={pageStyles.formError}>
                    {registerForm.formState.errors.user.message}
                  </span>
                )}

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

                <Button type="submit" fullWidth variant="secondary" disabled={isSendingCode}>
                  {isSendingCode ? 'Отправляем код…' : 'Получить код подтверждения'}
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Register && registerStep === RegisterStep.Code && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="register-code">
              <h2 className="titleSection">Подтверждение</h2>
              <p className={styles.hint}>{verificationHint}</p>

              <form
                className={styles.form}
                onSubmit={codeForm.handleSubmit(handleVerifyCode)}
                noValidate
              >
                <label htmlFor="register-code">Код из {verificationChannel === 'email' ? 'письма' : 'SMS'}</label>
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

                <Button type="submit" fullWidth disabled={isVerifyingCode}>
                  {isVerifyingCode ? 'Проверяем…' : 'Подтвердить и зарегистрироваться'}
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

          {activeTab === AuthTab.Recovery && (
            <section className={`${styles.card} ${styles.tabPanel}`} key="recovery">
              <h2 className="titleSection">Восстановление пароля</h2>
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={recoveryForm.handleSubmit(handleRecovery)}
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

                <Button type="submit" fullWidth>
                  Отправить ссылку
                </Button>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

export {
  AuthPage,
}
