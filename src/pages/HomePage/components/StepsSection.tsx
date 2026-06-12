import { memo } from 'react';
import { HOME_STEPS } from '@/constants';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
const StepsSection = memo(function StepsSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Просто" title="Как это работает"/>
      <div className={styles.stepsGrid}>
        {HOME_STEPS.map((step) => (<article key={step.num} className={styles.stepCard}>
            <span className={styles.stepNumber}>{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>))}
      </div>
    </div>);
});

export {
  StepsSection,
}
