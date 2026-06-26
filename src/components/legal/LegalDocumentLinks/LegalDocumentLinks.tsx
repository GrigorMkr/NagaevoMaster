import { Link } from 'react-router-dom';
import { LEGAL_DOCUMENTS } from '@/constants/legal';
import styles from './LegalDocumentLinks.module.css';

interface LegalDocumentLinksProps {
  variant?: 'inline' | 'stack';
  className?: string;
}

function LegalDocumentLinks({ variant = 'inline', className }: LegalDocumentLinksProps) {
  return (
    <nav className={[styles.nav, styles[variant], className].filter(Boolean).join(' ')} aria-label="Юридические документы">
      {LEGAL_DOCUMENTS.map((doc, index) => (
        <span key={doc.path} className={styles.item}>
          <Link to={doc.path} className={styles.link}>
            {doc.shortLabel}
          </Link>
          {variant === 'inline' && index < LEGAL_DOCUMENTS.length - 1 ? (
            <span className={styles.sep} aria-hidden>·</span>
          ) : null}
        </span>
      ))}
    </nav>
  );
}

export {
  LegalDocumentLinks,
};
