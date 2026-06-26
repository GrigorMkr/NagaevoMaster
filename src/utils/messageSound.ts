import { Capacitor } from '@capacitor/core';
import { SITE_ORIGIN } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';
import { MessageSound } from '@/plugins/messageSound';

let audio: HTMLAudioElement | null = null;
let unlocked = false;
let lastPlayedAt = 0;

const PLAY_COOLDOWN_MS = 800;

function resolveSoundUrl(): string {
  if (isNativeApp()) {
    return `${SITE_ORIGIN}/sounds/message.mp3`;
  }
  return '/sounds/message.mp3';
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(resolveSoundUrl());
    audio.preload = 'auto';
  }
  return audio;
}

function unlockMessageSound(): void {
  if (unlocked || typeof window === 'undefined') return;
  const element = getAudio();
  const prevVolume = element.volume;
  element.volume = 0;
  void element.play()
    .then(() => {
      element.pause();
      element.currentTime = 0;
      element.volume = prevVolume;
      unlocked = true;
    })
    .catch(() => {
      unlocked = true;
    });
}

async function playNativeMessageSound(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('MessageSound')) {
    return false;
  }
  try {
    await MessageSound.play();
    return true;
  } catch {
    return false;
  }
}

async function playMessageSound(): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastPlayedAt < PLAY_COOLDOWN_MS) return;

  if (await playNativeMessageSound()) {
    lastPlayedAt = now;
    return;
  }

  try {
    const element = getAudio();
    element.src = resolveSoundUrl();
    element.volume = 1;
    element.currentTime = 0;
    await element.play();
    lastPlayedAt = now;
  } catch {
    // WebView autoplay may be blocked until unlockMessageSound()
  }
}

export {
  playMessageSound,
  unlockMessageSound,
};
