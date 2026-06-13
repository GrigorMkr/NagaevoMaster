import { memo } from 'react';
import { HOME_FEATURES } from '@/constants';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
const FeaturesSection = memo(function FeaturesSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Преимущества" title="Почему NagaevoMaster?"/>
      <div className={styles.featureGrid}>
        {HOME_FEATURES.map((feature) => (
          <article key={feature.title} className={styles.featureCard}>
            <div className={styles.featureMedia}>
              <img
                className={styles.featureImage}
                src={feature.image}
                alt=""
                loading="lazy"
              />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </div>);
});

export {
  FeaturesSection,
}
