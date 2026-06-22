import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo/Logo';
import { CONTACT_EMAIL, FOOTER_NAV_ITEMS, GEO, APP_NAME, SITE_VERSION, SITE_UPDATED_LABEL } from '@/constants';
import styles from './Footer.module.css';
const Footer = memo(function Footer() {
    const currentYear = new Date().getFullYear();
    return (<footer className={`${styles.footer} site-footer`}>
      <div className="container">
        <div className={styles.inner}>
          <Logo variant="footer"/>

          <nav className={styles.nav}>
            {FOOTER_NAV_ITEMS.map((link) => (<Link key={link.to} to={link.to}>
                {link.label}
              </Link>))}
          </nav>

          <p className={styles.geo}>
            {GEO.settlement} · {GEO.radiusKm} км
          </p>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legalBlock}>
            <p className={styles.copyright}>
              ©
              {' '}
              {currentYear}
              {' '}
              {APP_NAME}
              . Все права защищены.
            </p>
            <p className={styles.legalNote}>
              Материалы сайта и приложения предназначены для личного использования.
              Копирование, распространение и коммерческое использование без письменного
              согласия правообладателя запрещены.
            </p>
            <p className={styles.legalNote}>
              Товарный знак «Нагаево Мастер» и логотип принадлежат правообладателю сервиса.
            </p>
          </div>
          <div className={styles.bottomMeta}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
              {CONTACT_EMAIL}
            </a>
            <span className={styles.siteRelease}>
              Сайт v
              {SITE_VERSION}
              {' · '}
              обновлено
              {' '}
              {SITE_UPDATED_LABEL}
            </span>
          </div>
        </div>
      </div>
    </footer>);
});

export {
  Footer,
}
