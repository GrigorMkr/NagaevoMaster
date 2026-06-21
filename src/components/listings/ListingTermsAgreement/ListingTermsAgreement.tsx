import { memo } from 'react';
import { BAN_POLICY_TEXT, COMMUNITY_RULES, LISTING_PUBLISH_TERMS_LABEL } from '@/constants/communityRules';
import styles from './ListingTermsAgreement.module.css';

interface ListingTermsAgreementProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ListingTermsAgreement = memo(function ListingTermsAgreement({
  checked,
  onChange,
}: ListingTermsAgreementProps) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>Условия размещения объявления</h3>
      <details>
        <summary className={styles.rulesToggle}>Показать правила</summary>
        <ul className={styles.rules}>
          {COMMUNITY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className={styles.policy}>{BAN_POLICY_TEXT}</p>
      </details>
      <label className={styles.agree}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
        />
        <span>{LISTING_PUBLISH_TERMS_LABEL}</span>
      </label>
    </div>
  );
});

export {
  ListingTermsAgreement,
};
