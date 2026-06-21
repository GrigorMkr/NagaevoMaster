import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import {
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/user/userSelectors';
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { CONTACT_EMAIL, GEO, APP_NAME } from '@/utils/constants';
import { sendContactMessage } from '@/services/contactApi';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { VALIDATION } from '@/constants/validation';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './ContactPage.module.css';

const contactSchema = z.object({
  message: z.string().min(
    VALIDATION.MIN_MESSAGE_LENGTH,
    `Сообщение должно быть не менее ${VALIDATION.MIN_MESSAGE_LENGTH} символов`,
  ),
});

type ContactFormData = z.infer<typeof contactSchema>;

function ContactPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authLoading = useAppSelector(selectAuthLoading);
  const user = useAppSelector(selectCurrentUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (!user) return;

    try {
      await sendContactMessage(data);
      toast.success(`Спасибо, ${user.name}! Мы свяжемся с вами.`);
      reset({ message: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
    }
  };

  return (
    <>
      <PageMeta title="Контакты" description={`Свяжитесь с администрацией ${APP_NAME}.`} />

      <div className={pageStyles.page}>
        <div className="container">
          <div className={styles.layout}>
            <Reveal delay={60}>
              <div>
                <PageHeader
                  badge="Связь"
                  title="Контакты"
                  subtitle="Задайте вопрос или предложите улучшение платформы"
                />

                <div className={`${styles.info} motion-stagger`}>
                  <div className={styles.infoItem}>
                    <span>📧</span>
                    <div>
                      <strong>Email</strong>
                      <p>
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span>📍</span>
                    <div>
                      <strong>Адрес</strong>
                      <p>
                        с. Нагаево, {GEO.district}
                        <br />
                        {GEO.region}, {GEO.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              {authLoading ? (
                <div className={styles.formState}>
                  <Spinner />
                </div>
              ) : !isAuthenticated || !user ? (
                <AuthRequiredPanel
                  title="Войдите, чтобы написать нам"
                  description="Сообщения принимаются только от зарегистрированных пользователей."
                />
              ) : (
                <form
                  className={styles.form}
                  action={ECHO_FORM_ACTION}
                  method="post"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                >
                  <div className={styles.field}>
                    <label htmlFor="name">Имя</label>
                    <input
                      id="name"
                      type="text"
                      readOnly
                      value={user.name}
                      className={`${pageStyles.input} ${styles.inputReadonly}`}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      readOnly
                      value={user.email}
                      className={`${pageStyles.input} ${styles.inputReadonly}`}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message">Сообщение</label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      className={styles.textarea}
                      {...register('message')}
                    />
                    {errors.message && (
                      <span className={styles.error}>{errors.message.message}</span>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                    {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                  </Button>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </>
  );
}

export {
  ContactPage,
};
