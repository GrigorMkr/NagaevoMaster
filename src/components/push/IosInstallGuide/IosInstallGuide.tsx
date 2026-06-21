import { isIosSafari } from '@/utils/pushEnvironment';
import classNames from 'classnames';
import styles from './IosInstallGuide.module.css';

interface IosInstallGuideProps {
  compact?: boolean;
}

function IosInstallGuide({ compact = false }: IosInstallGuideProps) {
  const inSafari = isIosSafari();

  return (
    <div className={classNames(styles.guide, compact && styles.guideCompact)}>
      {!compact && (
        <>
          <h3 className={styles.title}>Установите приложение на iPhone</h3>
          <p className={styles.lead}>
            Push-уведомления со звуком работают только из приложения на главном экране.
          </p>
        </>
      )}

      {!inSafari && (
        <p className={styles.warn}>
          Откройте в <strong>Safari</strong> — в других браузерах установка недоступна.
        </p>
      )}

      <ol className={styles.steps}>
        <li><strong>Поделиться</strong> ⬆️</li>
        <li><strong>На экран «Домой»</strong></li>
        <li><strong>Добавить</strong></li>
        <li>Открыть с <strong>главного экрана</strong></li>
        <li>Включить <strong>уведомления</strong></li>
      </ol>

      {compact && (
        <p className={styles.compactHint}>Поделиться → На экран «Домой» → Добавить</p>
      )}
    </div>
  );
}

export {
  IosInstallGuide,
};
