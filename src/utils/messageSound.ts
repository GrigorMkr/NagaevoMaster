let audio: HTMLAudioElement | null = null;
let unlocked = false;
let lastPlayedAt = 0;

const SOUND_URL = '/sounds/message.mp3';
const PLAY_COOLDOWN_MS = 800;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SOUND_URL);
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

async function playMessageSound(): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastPlayedAt < PLAY_COOLDOWN_MS) return;

  try {
    const element = getAudio();
    element.volume = 1;
    element.currentTime = 0;
    await element.play();
    lastPlayedAt = now;
  } catch {
    // только message.mp3, без запасных звуков
  }
}

export {
  playMessageSound,
  unlockMessageSound,
};
