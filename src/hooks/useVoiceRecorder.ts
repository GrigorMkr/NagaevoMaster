import { useCallback, useEffect, useRef, useState } from 'react';
import { requestMicrophoneStream } from '@/utils/microphoneAccess';

const MAX_VOICE_SECONDS = 120;

interface UseVoiceRecorderResult {
  isRecording: boolean;
  isSupported: boolean;
  seconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
  cancelRecording: () => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
  return 'webm';
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

    const stream = await requestMicrophoneStream();
    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
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

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size === 0) {
          resolve(null);
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const extension = extensionForMime(mimeType);
        resolve(new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType }));
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
