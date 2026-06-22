import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_VOICE_SECONDS = 120;

interface UseVoiceRecorderResult {
  isRecording: boolean;
  isSupported: boolean;
  seconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
  cancelRecording: () => void;
}

function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const isSupported = typeof window !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined';

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearTimer();
    cleanupStream();
    recorderRef.current?.stop();
  }, [cleanupStream, clearTimer]);

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return;
    const mimeType = pickMimeType();
    if (!mimeType) {
      throw new Error('Запись голоса не поддерживается в этом браузере');
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new Error(
          'Микрофон недоступен. Разрешите доступ в браузере и обновите страницу после деплоя сайта.',
          { cause: error },
        );
      }
      throw error;
    }
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start(250);
    setIsRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= MAX_VOICE_SECONDS) {
          recorder.stop();
        }
        return current + 1;
      });
    }, 1000);
  }, [isRecording, isSupported]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return null;
    }

    return new Promise<File | null>((resolve) => {
      recorder.onstop = () => {
        clearTimer();
        cleanupStream();
        setIsRecording(false);
        setSeconds(0);
        recorderRef.current = null;

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        if (blob.size === 0) {
          resolve(null);
          return;
        }

        const extension = recorder.mimeType.includes('ogg') ? 'ogg' : 'webm';
        resolve(new File([blob], `voice-${Date.now()}.${extension}`, { type: recorder.mimeType }));
      };
      recorder.stop();
    });
  }, [cleanupStream, clearTimer]);

  const cancelRecording = useCallback(() => {
    clearTimer();
    chunksRef.current = [];
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    cleanupStream();
    setIsRecording(false);
    setSeconds(0);
  }, [cleanupStream, clearTimer]);

  return {
    isRecording,
    isSupported,
    seconds,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export {
  useVoiceRecorder,
}
