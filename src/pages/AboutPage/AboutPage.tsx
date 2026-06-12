import { PageMeta } from '@/components/ui/PageMeta/PageMeta'

import { PageHeader } from '@/components/ui/PageHeader/PageHeader'

import { APP_DESCRIPTION, GEO } from '@/utils/constants'

import pageStyles from '@/styles/page.module.css'

import styles from './AboutPage.module.css'



const audience = [

  'Жители поселка и дачники',

  'Владельцы домов и земельных участков',

  'Строители, фермеры и малый бизнес',

  'Мужчины и женщины от 18 до 65 лет',

]



const moderationRules = [

  'Запрещены оскорбления, спам и реклама без согласования',

  'Объявления должны относиться к услугам в радиусе 50 км от Нагаево',

  'Контакты и цены указываются честно и актуально',

  'Модератор может скрыть объявление при жалобах жителей',

]



const platformRules = [

  'Регистрация доступна жителям и мастерам из окрестностей',

  'Один аккаунт — один исполнитель или компания',

  'Отзывы публикуются только после проверки модератором',

  'Администрация оставляет за собой право блокировать нарушителей',

]



export function AboutPage() {

  return (

    <>

      <PageMeta title="О проекте" description={APP_DESCRIPTION} />



      <div className={pageStyles.page}>

        <div className="container">

          <PageHeader

            badge="О нас"

            title="О проекте NagaevoMaster"

            subtitle={APP_DESCRIPTION}

          />



          <div className={styles.grid}>

            <article className={styles.card}>

              <span className={styles.cardIcon}>🎯</span>

              <h2>Целевая аудитория</h2>

              <ul>

                {audience.map((item) => (

                  <li key={item}>{item}</li>

                ))}

              </ul>

            </article>



            <article className={styles.card}>

              <span className={styles.cardIcon}>🗺️</span>

              <h2>География</h2>

              <p>

                Поселок <strong>{GEO.settlement}</strong> и окрестности в радиусе{' '}

                <strong>{GEO.radiusKm} км</strong>. Мы объединяем местные услуги в одном

                удобном каталоге.

              </p>

            </article>



            <article className={styles.card}>

              <span className={styles.cardIcon}>💡</span>

              <h2>Наша миссия</h2>

              <p>

                Сделать поиск специалистов и услуг в Нагаево простым, быстрым и надёжным —

                для жителей и для тех, кто предлагает свои услуги.

              </p>

            </article>



            <article className={styles.card}>

              <span className={styles.cardIcon}>📋</span>

              <h2>Правила платформы</h2>

              <ul>

                {platformRules.map((rule) => (

                  <li key={rule}>{rule}</li>

                ))}

              </ul>

            </article>



            <article className={styles.card}>

              <span className={styles.cardIcon}>🛡️</span>

              <h2>Модерация</h2>

              <ul>

                {moderationRules.map((rule) => (

                  <li key={rule}>{rule}</li>

                ))}

              </ul>

            </article>

          </div>

        </div>

      </div>

    </>

  )

}

