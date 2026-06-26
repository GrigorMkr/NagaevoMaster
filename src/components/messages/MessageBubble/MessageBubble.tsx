import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import type { ChatMessage } from '@/types/message';
import { serviceDetailPath } from '@/constants';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { formatMessageSentAt } from '@/utils/formatMessageTime';
import { getReactionOnlySize, isReactionOnlyMessage, type ReactionOnlySize } from '@/utils/messageReactions';
import { MessageRichText } from '@/components/messages/MessageRichText/MessageRichText';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import { VoiceMessagePlayer } from '@/components/messages/VoiceMessagePlayer/VoiceMessagePlayer';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import { UserNameWithStatus } from '@/components/ui/UserNameWithStatus/UserNameWithStatus';
import { ImageLightbox } from '@/components/ui/ImageLightbox/ImageLightbox';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
  senderOnline?: boolean;
  highlighted?: boolean;
  onEdit?: (messageId: string, body: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onForward?: (message: ChatMessage) => void;
}

const REACTION_ONLY_SIZE_CLASS: Record<ReactionOnlySize, string> = {
  one: 'reactionOnlyOne',
  two: 'reactionOnlyTwo',
  three: 'reactionOnlyThree',
  many: 'reactionOnlyMany',
};

function MessageBubble({
  message,
  showSenderName,
  senderOnline,
  highlighted,
  onEdit,
  onDelete,
  onForward,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const attachmentUrl = message.attachmentUrl
    ? resolveUploadUrl(message.attachmentUrl)
    : undefined;
  const isImage = message.type === 'file' && message.attachmentMime?.startsWith('image/');
  const isVideo = message.type === 'file' && message.attachmentMime?.startsWith('video/');
  const canEdit = message.isMine && message.type === 'text' && !message.isDeleted && Boolean(onEdit);
  const canDelete = message.isMine && !message.isDeleted && Boolean(onDelete);
  const canForward = !message.isDeleted && Boolean(onForward)
    && (message.type !== 'listing' || Boolean(message.listingPreview || message.listingId));
  const showOwnMenu = message.isMine && (canEdit || canDelete || canForward);
  const showForwardOnly = !message.isMine && canForward;

  const reactionOnly = useMemo(
    () => Boolean(message.body && message.type === 'text' && isReactionOnlyMessage(message.body)),
    [message.body, message.type],
  );
  const reactionOnlySize = useMemo(
    () => (reactionOnly && message.body ? getReactionOnlySize(message.body) : null),
    [reactionOnly, message.body],
  );

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!editing) {
      setEditText(message.body);
    }
  }, [message.body, editing]);

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    const body = editText.trim();
    if (!body || !onEdit) return;
    setSaving(true);
    try {
      await onEdit(message.id, body);
      setEditing(false);
      setMenuOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setMenuOpen(false);
    await onDelete(message.id);
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={classNames(
        message.isMine ? styles.mineWrap : styles.otherWrap,
        highlighted && styles.highlighted,
      )}
    >
      {showSenderName && !message.isMine && !message.isDeleted && (
        <p className={styles.senderName}>
          <UserNameWithStatus
            name={message.senderName}
            userId={message.senderId}
            online={senderOnline}
          />
        </p>
      )}
      <div
        className={classNames(
          message.isMine ? styles.bubbleMine : styles.bubbleOther,
          message.isDeleted && styles.bubbleDeleted,
          reactionOnly && styles.bubbleEmojiOnly,
        )}
      >
        {showOwnMenu && (
          <div className={styles.actions} ref={menuRef}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Действия с сообщением"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <ToolbarIcon name="menu" accent="currentColor" motion="none" />
            </button>
            {menuOpen && (
              <div className={styles.menu} role="menu">
                {canEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    Изменить
                  </button>
                )}
                {canForward && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onForward?.(message);
                    }}
                  >
                    Переслать
                  </button>
                )}
                {canDelete && (
                  <button type="button" role="menuitem" className={styles.menuDanger} onClick={() => void handleDelete()}>
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showForwardOnly && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.forwardBtn}
              aria-label="Переслать сообщение"
              onClick={() => onForward?.(message)}
            >
              <ToolbarIcon name="forward" accent="#7ec8a8" motion="pulse" />
            </button>
          </div>
        )}

        {message.isForwarded && !message.isDeleted && (
          <p className={styles.forwarded}>Переслано</p>
        )}

        {message.senderIsStaff && message.senderRole && (
          <StaffBadge role={message.senderRole} compact />
        )}

        {message.isDeleted ? (
          <p className={styles.deleted}>Сообщение удалено</p>
        ) : (
          <>
            {message.type === 'voice' && attachmentUrl && (
              <VoiceMessagePlayer src={attachmentUrl} isMine={message.isMine} />
            )}

            {isImage && attachmentUrl && (
              <button
                type="button"
                className={styles.imageButton}
                onClick={() => setPhotoOpen(true)}
                aria-label="Открыть фото"
              >
                <img
                  className={styles.image}
                  src={attachmentUrl}
                  alt={message.attachmentName ?? 'Вложение'}
                />
              </button>
            )}

            {isVideo && attachmentUrl && (
              <video className={styles.video} src={attachmentUrl} controls preload="metadata" />
            )}

            {message.type === 'file' && attachmentUrl && !isImage && !isVideo && (
              <a className={styles.fileLink} href={attachmentUrl} target="_blank" rel="noreferrer" download>
                <ToolbarIcon name="paperclip" accent="var(--color-mint)" motion="float" />
                <span>{message.attachmentName ?? 'Скачать файл'}</span>
              </a>
            )}

            {message.type === 'listing' && message.listingPreview && (
              <div className={styles.listingBlock}>
                <Link to={serviceDetailPath(message.listingPreview.id)} className={styles.listingCard}>
                  {message.listingPreview.image && (
                    <ListingPhoto
                      className={styles.listingImage}
                      src={message.listingPreview.image}
                      alt=""
                    />
                  )}
                  <span className={styles.listingBody}>
                    <span className={styles.listingLabel}>Объявление</span>
                    <strong>{message.listingPreview.title}</strong>
                    <span className={styles.listingPrice}>
                      от
                      {' '}
                      {message.listingPreview.priceFrom}
                      {' '}
                      ₽ /
                      {' '}
                      {message.listingPreview.unit}
                    </span>
                  </span>
                </Link>
                {canForward && (
                  <button
                    type="button"
                    className={styles.listingRepostBtn}
                    onClick={() => onForward?.(message)}
                  >
                    <ToolbarIcon name="forward" accent="currentColor" motion="pulse" />
                    Переслать
                  </button>
                )}
              </div>
            )}

            {editing ? (
              <form className={styles.editForm} action={ECHO_FORM_ACTION} method="post" onSubmit={(event) => void handleSaveEdit(event)}>
                <textarea
                  className={styles.editInput}
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                  rows={3}
                  maxLength={4000}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button type="button" className={styles.editCancel} onClick={() => setEditing(false)}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.editSave} disabled={saving || !editText.trim()}>
                    Сохранить
                  </button>
                </div>
              </form>
            ) : (
              message.body && (
                <div
                  className={classNames(
                    styles.text,
                    reactionOnly && styles.textEmojiOnly,
                    reactionOnlySize && styles[REACTION_ONLY_SIZE_CLASS[reactionOnlySize]],
                  )}
                >
                  <MessageRichText
                    text={message.body}
                    reactionOnly={reactionOnly}
                    reactionOnlySize={reactionOnlySize}
                  />
                </div>
              )
            )}
          </>
        )}

        {message.createdAt && (
          <footer className={styles.meta}>
            <time dateTime={message.createdAt} className={styles.sentAt}>
              {formatMessageSentAt(message.createdAt)}
            </time>
            {!message.isDeleted && message.editedAt && (
              <span className={styles.editedMark}>изменено</span>
            )}
          </footer>
        )}
      </div>

      {photoOpen && attachmentUrl && (
        <ImageLightbox
          src={attachmentUrl}
          alt={message.attachmentName ?? 'Фото'}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </div>
  );
}

export {
  MessageBubble,
};
