import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { CONTACT_EMAIL, GEO } from '@/utils/constants';
import { sendContactMessage } from '@/services/contactApi';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { VALIDATION } from '@/constants/validation';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import pageStyles from '@/styles/page.module.css';
import styles from './ContactPage.module.css';
const contactSchema = z.object({
    name: z.string().min(VALIDATION.MIN_NAME_LENGTH, `Введите имя (минимум ${VALIDATION.MIN_NAME_LENGTH} символа)`),
    email: z.string().email('Введите корректный email'),
    message: z.string().min(VALIDATION.MIN_MESSAGE_LENGTH, `Сообщение должно быть не менее ${VALIDATION.MIN_MESSAGE_LENGTH} символов`),
});
type ContactFormData = z.infer<typeof contactSchema>;
function ContactPage() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });
    const onSubmit = async (data: ContactFormData) => {
        try {
            await sendContactMessage(data);
            toast.success(`Спасибо, ${data.name}! Мы свяжемся с вами.`);
            reset();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
        }
    };
    return (<>
      <PageMeta title="Контакты" description="Свяжитесь с администрацией NagaevoMaster."/>

      <div className={pageStyles.page}>
        <div className="container">
          <div className={styles.layout}>
            <div>
              <PageHeader badge="Связь" title="Контакты" subtitle="Задайте вопрос или предложите улучшение платформы"/>

              <div className={styles.info}>
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

            <form className={styles.form} action={ECHO_FORM_ACTION} method="post" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className={styles.field}>
                <label htmlFor="name">Имя</label>
                <input id="name" type="text" required className={pageStyles.input} {...register('name')}/>
                {errors.name && <span className={styles.error}>{errors.name.message}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required className={pageStyles.input} {...register('email')}/>
                {errors.email && <span className={styles.error}>{errors.email.message}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="message">Сообщение</label>
                <textarea id="message" rows={5} required className={styles.textarea} {...register('message')}/>
                {errors.message && (<span className={styles.error}>{errors.message.message}</span>)}
              </div>

              <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>);
}

export {
  ContactPage,
}
