import { useState } from 'react'
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
  registerRequest,
  saveAuthToken,
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
import pageStyles from '@/styles/page.module.css'
import styles from './AuthPage.module.css'

enum AuthTab {
  Login = 'login',
  Register = 'register',
  Recovery = 'recovery',
}

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

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type RecoveryForm = z.infer<typeof recoverySchema>

function AuthPage() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAuthLoading = useAppSelector(selectAuthLoading)
  const [activeTab, setActiveTab] = useState<AuthTab>(AuthTab.Login)
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const recoveryForm = useForm<RecoveryForm>({ resolver: zodResolver(recoverySchema) })

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

  const handleLoginTabClick = () => setActiveTab(AuthTab.Login)
  const handleRegisterTabClick = () => setActiveTab(AuthTab.Register)
  const handleRecoveryTabClick = () => setActiveTab(AuthTab.Recovery)

  const handleLogin = async (data: LoginForm) => {
    try {
      const response = await loginRequest(data.user, data.password)
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      toast.success(`Добро пожаловать, ${response.user.name}!`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка входа'))
    }
  }

  const handleRegister = async (data: RegisterForm) => {
    try {
      const response = await registerRequest(data)
      saveAuthToken(response.token)
      dispatch(setUser(response.user))
      toast.success('Регистрация успешна')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка регистрации'))
    }
  }

  const handleRecovery = async (data: RecoveryForm) => {
    try {
      await recoveryRequest(data.email)
      toast.success(`Если email зарегистрирован, инструкция отправлена на ${data.email}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка восстановления'))
    }
  }

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
            <section className={styles.card}>
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

          {activeTab === AuthTab.Register && (
            <section className={styles.card}>
              <h2 className="titleSection">Регистрация</h2>
              <form
                className={styles.form}
                action={ECHO_FORM_ACTION}
                method="post"
                onSubmit={registerForm.handleSubmit(handleRegister)}
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

                <Button type="submit" fullWidth variant="secondary">
                  Зарегистрироваться
                </Button>
              </form>
            </section>
          )}

          {activeTab === AuthTab.Recovery && (
            <section className={styles.card}>
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
