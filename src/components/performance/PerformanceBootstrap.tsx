import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';

function PerformanceBootstrap() {
  usePerformanceProfile();
  return null;
}

export {
  PerformanceBootstrap,
};
