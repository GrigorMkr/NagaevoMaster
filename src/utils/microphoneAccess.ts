import { isNativeApp } from '@/utils/nativeApp';

function microphoneDeniedMessage(): string {
  if (isNativeApp()) {
    return 'Разрешите доступ к микрофону в настройках телефона: Приложения → Нагаево Мастер → Разрешения → Микрофон.';
  }
  return 'Разрешите доступ к микрофону в настройках браузера (значок замка в адресной строке) и обновите страницу.';
}

function mapMicrophoneError(error: unknown): Error {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return new Error(microphoneDeniedMessage(), { cause: error });
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return new Error('Микрофон не найден на этом устройстве.', { cause: error });
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return new Error('Микрофон занят другим приложением. Закройте его и попробуйте снова.', { cause: error });
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Не удалось получить доступ к микрофону.');
}

async function requestMicrophoneStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      isNativeApp()
        ? 'Запись голоса недоступна. Обновите приложение из RuStore.'
        : 'Запись голоса не поддерживается в этом браузере.',
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (error) {
    throw mapMicrophoneError(error);
  }
}

export {
  microphoneDeniedMessage,
  requestMicrophoneStream,
};
