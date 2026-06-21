import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo/Logo';
import { CONTACT_EMAIL, FOOTER_NAV_ITEMS, GEO, APP_NAME } from '@/constants';
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
          <span>© {currentYear} {APP_NAME}</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>);
});

export {
  Footer,
}
