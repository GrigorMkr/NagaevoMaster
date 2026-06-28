import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppUpdateType,
  InstallStatus,
  UpdateAvailability,
  addRuStoreInstallListener,
  completeRuStoreUpdate,
  fetchRuStoreAppUpdateInfo,
  initRuStoreUpdate,
  isRuStoreUpdateAvailable,
  startFlexibleRuStoreUpdate,
  type AppUpdateInfo,
  type InstallState,
} from '@/services/rustoreUpdate';
import { RuStoreUpdateModal } from '@/components/native/RuStoreUpdateModal/RuStoreUpdateModal';

const CHECK_DELAY_MS = 4_000;

function RuStoreUpdateBootstrap() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [installState, setInstallState] = useState<InstallState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const checkedRef = useRef(false);

  const refreshUpdateInfo = useCallback(async () => {
    const info = await fetchRuStoreAppUpdateInfo();
    setUpdateInfo(info);
    return info;
  }, []);

  useEffect(() => {
    if (!isRuStoreUpdateAvailable()) {
      return undefined;
    }

    let cancelled = false;

    const bootstrap = async () => {
      await initRuStoreUpdate();
      if (cancelled) {
        return;
      }

      const info = await refreshUpdateInfo();
      if (cancelled || !info) {
        return;
      }

      if (info.updateAvailability === UpdateAvailability.UpdateAvailable) {
        setModalOpen(true);
      }
    };

    const timer = window.setTimeout(() => {
      if (checkedRef.current) {
        return;
      }
      checkedRef.current = true;
      void bootstrap();
    }, CHECK_DELAY_MS);

    const removeListener = addRuStoreInstallListener((state) => {
      setInstallState(state);
      if (state.installStatus === InstallStatus.Downloaded) {
        setModalOpen(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      removeListener();
    };
  }, [refreshUpdateInfo]);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      await startFlexibleRuStoreUpdate();
      await refreshUpdateInfo();
    } finally {
      setBusy(false);
    }
  }, [refreshUpdateInfo]);

  const handleInstall = useCallback(async () => {
    setBusy(true);
    try {
      await completeRuStoreUpdate(AppUpdateType.Flexible);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleLater = useCallback(() => {
    setModalOpen(false);
  }, []);

  if (!isRuStoreUpdateAvailable()) {
    return null;
  }

  const downloaded = installState?.installStatus === InstallStatus.Downloaded
    || updateInfo?.installStatus === InstallStatus.Downloaded;
  const downloading = installState?.installStatus === InstallStatus.Downloading;
  const progress = downloading && installState && installState.totalBytesToDownload > 0
    ? Math.min(100, Math.round((installState.bytesDownloaded / installState.totalBytesToDownload) * 100))
    : null;

  return (
    <RuStoreUpdateModal
      open={modalOpen && Boolean(updateInfo?.updateAvailability === UpdateAvailability.UpdateAvailable || downloaded)}
      downloaded={downloaded}
      downloading={downloading}
      progress={progress}
      availableVersionCode={updateInfo?.availableVersionCode ?? null}
      busy={busy}
      onDownload={() => void handleDownload()}
      onInstall={() => void handleInstall()}
      onLater={handleLater}
    />
  );
}

export {
  RuStoreUpdateBootstrap,
};
