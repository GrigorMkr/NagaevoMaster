import { type MouseEvent, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './VoiceMessagePlayer.module.css';

interface VoiceMessagePlayerProps {
  src: string;
  isMine?: boolean;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VoiceMessagePlayer({ src, isMine = false }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrent(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const handleSeek = (event: MouseEvent<HTMLButtonElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  return (
    <div className={classNames(styles.player, isMine ? styles.mine : styles.other)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? 'Пауза' : 'Воспроизвести'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <div className={styles.trackWrap}>
        <button type="button" className={styles.track} onClick={handleSeek} aria-label="Перемотка">
          <span className={styles.progress} style={{ width: `${progress}%` }} />
        </button>
        <span className={styles.time}>
          {formatTime(current)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

export {
  VoiceMessagePlayer,
}
