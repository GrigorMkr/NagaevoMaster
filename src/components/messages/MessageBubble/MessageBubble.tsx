import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ChatMessage } from '@/types/message';
import { serviceDetailPath } from '@/constants';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import { VoiceMessagePlayer } from '@/components/messages/VoiceMessagePlayer/VoiceMessagePlayer';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import { ImageLightbox } from '@/components/ui/ImageLightbox/ImageLightbox';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onEdit?: (messageId: string, body: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onForward?: (message: ChatMessage) => void;
}

function MessageBubble({ message, onEdit, onDelete, onForward }: MessageBubbleProps) {
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
  const canEdit = message.isMine && message.type === 'text' && !message.isDeleted && Boolean(onEdit);
  const canDelete = message.isMine && !message.isDeleted && Boolean(onDelete);
  const canForward = !message.isDeleted && Boolean(onForward)
    && (message.type !== 'listing' || Boolean(message.listingPreview || message.listingId));
  const showOwnMenu = message.isMine && (canEdit || canDelete || canForward);
  const showForwardOnly = !message.isMine && canForward;

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
    <div className={message.isMine ? styles.mineWrap : styles.otherWrap}>
      <div
        className={`${message.isMine ? styles.bubbleMine : styles.bubbleOther} ${message.isDeleted ? styles.bubbleDeleted : ''}`}
      >
        {showOwnMenu && (
          <div className={styles.actions} ref={menuRef}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Действия с сообщением"
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋮
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
              ↪
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

            {message.type === 'file' && attachmentUrl && !isImage && (
              <a className={styles.fileLink} href={attachmentUrl} target="_blank" rel="noreferrer" download>
                📎 {message.attachmentName ?? 'Скачать файл'}
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
                    ↪ Переслать
                  </button>
                )}
              </div>
            )}

            {editing ? (
              <form className={styles.editForm} onSubmit={(event) => void handleSaveEdit(event)}>
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
              message.body && <div className={styles.text}>{message.body}</div>
            )}
          </>
        )}

        {!message.isDeleted && (message.editedAt || message.createdAt) && (
          <footer className={styles.meta}>
            {message.editedAt && <span>изменено</span>}
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
