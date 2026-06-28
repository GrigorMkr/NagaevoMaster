import { useMemo, type CSSProperties } from 'react';
import {
  buildVkVideoEmbedUrl,
  vkVideoAspectRatio,
  type VkVideoParams,
} from '@/utils/parseVkVideo';
import { useVkWidgets } from '@/constants/vkWidgets';
import styles from './VkVideoEmbed.module.css';

interface VkVideoEmbedProps {
  video?: VkVideoParams | null;
  title?: string;
  hd?: number;
  autoplay?: boolean;
  showTrackingNote?: boolean;
  showOpenLink?: boolean;
  className?: string;
}

function VkVideoEmbed({
  video,
  title = 'Видео ВКонтакте',
  hd,
  autoplay = false,
  showTrackingNote = true,
  showOpenLink = true,
  className,
}: VkVideoEmbedProps) {
  const config = useVkWidgets();

  const resolved = useMemo(() => {
    const base = video ?? config.video;
    if (!base) {
      return null;
    }
    return {
      ...base,
      hd: hd ?? base.hd ?? 2,
      autoplay: autoplay || base.autoplay,
    };
  }, [video, config.video, hd, autoplay]);

  if (!resolved) {
    return null;
  }

  const embedUrl = buildVkVideoEmbedUrl(resolved);
  const aspect = vkVideoAspectRatio(resolved.hd);
  const watchUrl = `https://vk.ru/video${resolved.oid}_${resolved.id}`;

  return (
    <div className={className ? `${styles.wrapper} ${className}` : styles.wrapper}>
      <div
        className={styles.frame}
        style={{ '--vk-video-aspect': String(aspect) } as CSSProperties}
      >
        <iframe
          className={styles.iframe}
          src={embedUrl}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {showTrackingNote && (
        <p className={styles.note}>
          В Firefox и Safari плеер может не загрузиться при включённой защите от отслеживания.
          Отключите её для домена vk.ru или откройте ролик на VK.
        </p>
      )}
      {showOpenLink && (
        <a
          className={styles.link}
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Смотреть на ВКонтакте
        </a>
      )}
    </div>
  );
}

export {
  VkVideoEmbed,
};
