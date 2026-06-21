import { Capacitor } from '@capacitor/core';

function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function nativePlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

function isNativeIos(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

function isNativeAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export {
  isNativeApp,
  nativePlatform,
  isNativeIos,
  isNativeAndroid,
};
