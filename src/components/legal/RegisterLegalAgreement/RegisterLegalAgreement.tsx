import { memo } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_DOCUMENTS, REGISTER_LEGAL_CONSENT_LABEL } from '@/constants/legal';
import styles from './RegisterLegalAgreement.module.css';

interface RegisterLegalAgreementProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const RegisterLegalAgreement = memo(function RegisterLegalAgreement({
  checked,
  onChange,
}: RegisterLegalAgreementProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>Перед регистрацией ознакомьтесь с документами:</p>
      <ul className={styles.docs}>
        {LEGAL_DOCUMENTS.map((doc) => (
          <li key={doc.path}>
            <Link to={doc.path} target="_blank" rel="noopener noreferrer">
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
      <label className={styles.agree}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
        />
        <span>{REGISTER_LEGAL_CONSENT_LABEL}</span>
      </label>
    </div>
  );
});

export {
  RegisterLegalAgreement,
};
