import { registerPlugin } from '@capacitor/core';

export enum UpdateAvailability {
  Unknown = 0,
  UpdateNotAvailable = 1,
  UpdateAvailable = 2,
  DeveloperTriggeredUpdateInProgress = 3,
}

export enum InstallStatus {
  Unknown = 0,
  Downloaded = 1,
  Downloading = 2,
  Failed = 3,
  Pending = 5,
}

export enum AppUpdateType {
  Flexible = 0,
  Immediate = 1,
  Silent = 2,
}

export enum ResultCode {
  ResultOk = -1,
  ResultCanceled = 0,
  ActivityNotFound = 2,
}

export interface AppUpdateInfo {
  updateAvailability: UpdateAvailability;
  installStatus: InstallStatus;
  availableVersionCode: number;
  immediateUpdateAllowed: boolean;
  flexibleUpdateAllowed: boolean;
  silentUpdateAllowed: boolean;
}

export interface InstallState {
  installStatus: InstallStatus;
  bytesDownloaded: number;
  totalBytesToDownload: number;
  installErrorCode: number;
}

interface RuStoreUpdatePlugin {
  init(): Promise<void>;
  getAppUpdateInfo(): Promise<AppUpdateInfo>;
  download(): Promise<{ resultCode: number }>;
  immediate(): Promise<{ resultCode: number }>;
  silent(): Promise<{ resultCode: number }>;
  completeUpdate(options: { type: AppUpdateType.Flexible | AppUpdateType.Silent }): Promise<void>;
  addListener(
    eventName: 'installStateUpdate',
    listener: (state: InstallState) => void,
  ): Promise<{ remove: () => void }>;
}

const RuStoreUpdate = registerPlugin<RuStoreUpdatePlugin>('RuStoreUpdate');

export {
  RuStoreUpdate,
};
