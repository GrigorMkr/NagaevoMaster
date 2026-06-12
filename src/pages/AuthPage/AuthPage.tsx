import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { Button } from '@/components/ui/Button/Button'
import { ECHO_FORM_ACTION } from '@/constants/forms'
import pageStyles from '@/styles/page.module.css'
import styles from './AuthPage.module.css'

enum AuthTab {
  Login = 'login',
  Register = 'register',
  Recovery = 'recovery',
}

const loginSchema = z.object({
  user: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Укажите имя'),
  phone: z.string().min(10, 'Укажите телефон'),
})

const recoverySchema = z.object({
  email: z.string().email('Введите корректный email'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type RecoveryForm = z.infer<typeof recoverySchema>

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>(AuthTab.Login)
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const recoveryForm = useForm<RecoveryForm>({ resolver: zodResolver(recoverySchema) })

  const handleLoginTabClick = () => setActiveTab(AuthTab.Login)
  const handleRegisterTabClick = () => setActiveTab(AuthTab.Register)
  const handleRecoveryTabClick = () => setActiveTab(AuthTab.Recovery)

  const handleLogin = (data: LoginForm) => {
    toast.success(`Вход: ${data.user} (демо — подключите API /auth/login)`)
  }

  const handleRegister = (data: RegisterForm) => {
    toast.success(`Регистрация: ${data.name} (демо — подключите API /auth/register)`)
  }

  const handleRecovery = (data: RecoveryForm) => {
    toast.success(`Ссылка для восстановления отправлена на ${data.email}`)
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
              >
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  className={pageStyles.input}
                  {...loginForm.register('user')}
                />
                {loginForm.formState.errors.user && (
                  <span className={styles.error}>{loginForm.formState.errors.user.message}</span>
                )}
                <label htmlFor="login-password">Пароль</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  className={pageStyles.input}
                  {...loginForm.register('password')}
                />
                <Button type="submit" fullWidth>Войти</Button>
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
              >
                <label htmlFor="register-name">Имя</label>
                <input
                  id="register-name"
                  type="text"
                  required
                  className={pageStyles.input}
                  {...registerForm.register('name')}
                />
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  required
                  className={pageStyles.input}
                  {...registerForm.register('user')}
                />
                <label htmlFor="register-phone">Телефон</label>
                <input
                  id="register-phone"
                  type="tel"
                  required
                  className={pageStyles.input}
                  {...registerForm.register('phone')}
                />
                <label htmlFor="register-password">Пароль</label>
                <input
                  id="register-password"
                  type="password"
                  required
                  className={pageStyles.input}
                  {...registerForm.register('password')}
                />
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
              >
                <label htmlFor="recovery-email">Email</label>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  className={pageStyles.input}
                  {...recoveryForm.register('email')}
                />
                {recoveryForm.formState.errors.email && (
                  <span className={styles.error}>{recoveryForm.formState.errors.email.message}</span>
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
