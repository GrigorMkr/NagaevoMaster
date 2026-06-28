import { Capacitor } from '@capacitor/core';
import {
  AppUpdateType,
  InstallStatus,
  ResultCode,
  RuStoreUpdate,
  UpdateAvailability,
  type AppUpdateInfo,
  type InstallState,
} from '@/plugins/rustoreUpdate';
import { isNativeAndroid } from '@/utils/nativeApp';

function isRuStoreUpdateAvailable(): boolean {
  return isNativeAndroid() && Capacitor.isPluginAvailable('RuStoreUpdate');
}

async function initRuStoreUpdate(): Promise<void> {
  if (!isRuStoreUpdateAvailable()) {
    return;
  }
  await RuStoreUpdate.init();
}

async function fetchRuStoreAppUpdateInfo(): Promise<AppUpdateInfo | null> {
  if (!isRuStoreUpdateAvailable()) {
    return null;
  }
  try {
    return await RuStoreUpdate.getAppUpdateInfo();
  } catch {
    return null;
  }
}

function isUpdateReady(info: AppUpdateInfo | null): boolean {
  return info?.updateAvailability === UpdateAvailability.UpdateAvailable;
}

function isUpdateDownloaded(info: AppUpdateInfo | null): boolean {
  return info?.installStatus === InstallStatus.Downloaded;
}

async function startFlexibleRuStoreUpdate(): Promise<number | null> {
  if (!isRuStoreUpdateAvailable()) {
    return null;
  }
  try {
    const result = await RuStoreUpdate.download();
    return result.resultCode;
  } catch {
    return null;
  }
}

async function startImmediateRuStoreUpdate(): Promise<number | null> {
  if (!isRuStoreUpdateAvailable()) {
    return null;
  }
  try {
    const result = await RuStoreUpdate.immediate();
    return result.resultCode;
  } catch {
    return null;
  }
}

async function startSilentRuStoreUpdate(): Promise<number | null> {
  if (!isRuStoreUpdateAvailable()) {
    return null;
  }
  try {
    const result = await RuStoreUpdate.silent();
    return result.resultCode;
  } catch {
    return null;
  }
}

async function completeRuStoreUpdate(type: AppUpdateType.Flexible | AppUpdateType.Silent): Promise<boolean> {
  if (!isRuStoreUpdateAvailable()) {
    return false;
  }
  try {
    await RuStoreUpdate.completeUpdate({ type });
    return true;
  } catch {
    return false;
  }
}

function addRuStoreInstallListener(listener: (state: InstallState) => void): () => void {
  if (!isRuStoreUpdateAvailable()) {
    return () => undefined;
  }

  let remove: (() => void) | null = null;
  void RuStoreUpdate.addListener('installStateUpdate', listener).then((handle) => {
    remove = () => handle.remove();
  });

  return () => {
    remove?.();
  };
}

export {
  AppUpdateType,
  InstallStatus,
  ResultCode,
  UpdateAvailability,
  addRuStoreInstallListener,
  completeRuStoreUpdate,
  fetchRuStoreAppUpdateInfo,
  initRuStoreUpdate,
  isRuStoreUpdateAvailable,
  isUpdateDownloaded,
  isUpdateReady,
  startFlexibleRuStoreUpdate,
  startImmediateRuStoreUpdate,
  startSilentRuStoreUpdate,
};

export type {
  AppUpdateInfo,
  InstallState,
};
