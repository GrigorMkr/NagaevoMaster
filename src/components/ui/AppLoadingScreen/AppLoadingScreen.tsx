import { memo } from 'react';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './AppLoadingScreen.module.css';

interface AppLoadingScreenProps {
  label?: string;
  fullscreen?: boolean;
}

const AppLoadingScreen = memo(function AppLoadingScreen({
  label = 'Загрузка…',
  fullscreen = true,
}: AppLoadingScreenProps) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="lg" />
      <p className={styles.label}>{label}</p>
    </div>
  );
});

export {
  AppLoadingScreen,
};
