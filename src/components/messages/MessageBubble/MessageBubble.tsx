import type { ChatMessage } from '@/types/message';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import { VoiceMessagePlayer } from '@/components/messages/VoiceMessagePlayer/VoiceMessagePlayer';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const attachmentUrl = message.attachmentUrl
    ? resolveUploadUrl(message.attachmentUrl)
    : undefined;

  return (
    <div className={message.isMine ? styles.mineWrap : styles.otherWrap}>
      <div className={message.isMine ? styles.bubbleMine : styles.bubbleOther}>
        {message.senderIsStaff && message.senderRole && (
          <StaffBadge role={message.senderRole} compact />
        )}
        {message.type === 'voice' && attachmentUrl && (
          <VoiceMessagePlayer src={attachmentUrl} isMine={message.isMine} />
        )}

        {message.type === 'file' && attachmentUrl && message.attachmentMime?.startsWith('image/') && (
          <a href={attachmentUrl} target="_blank" rel="noreferrer" className={styles.imageLink}>
            <img
              className={styles.image}
              src={attachmentUrl}
              alt={message.attachmentName ?? 'Вложение'}
            />
          </a>
        )}

        {message.type === 'file' && attachmentUrl && !message.attachmentMime?.startsWith('image/') && (
          <a className={styles.fileLink} href={attachmentUrl} target="_blank" rel="noreferrer" download>
            📎 {message.attachmentName ?? 'Скачать файл'}
          </a>
        )}

        {message.body && <div className={styles.text}>{message.body}</div>}
      </div>
    </div>
  );
}

export {
  MessageBubble,
}
