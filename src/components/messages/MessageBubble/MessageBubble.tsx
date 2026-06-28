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
import { TextAttachmentPreview } from '@/components/messages/TextAttachmentPreview/TextAttachmentPreview';
import { AttachmentViewer, type AttachmentViewerKind } from '@/components/messages/AttachmentViewer/AttachmentViewer';
import { useAttachmentDownload } from '@/hooks/useAttachmentDownload';
import { isTextAttachment } from '@/utils/textAttachment';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import { UserNameWithStatus } from '@/components/ui/UserNameWithStatus/UserNameWithStatus';
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
  const [attachmentViewerOpen, setAttachmentViewerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const attachmentUrl = message.attachmentUrl
    ? resolveUploadUrl(message.attachmentUrl)
    : undefined;
  const isImage = message.type === 'file' && message.attachmentMime?.startsWith('image/');
  const isVideo = message.type === 'file' && message.attachmentMime?.startsWith('video/');
  const isText = message.type === 'file'
    && isTextAttachment(message.attachmentMime, message.attachmentName);
  const attachmentFileName = message.attachmentName ?? 'file';
  const attachmentUploadPath = message.attachmentUrl ?? '';
  const attachmentViewerKind: AttachmentViewerKind | null = useMemo(() => {
    if (!attachmentUrl) {
      return null;
    }
    if (message.type === 'voice') {
      return 'voice';
    }
    if (message.type !== 'file') {
      return null;
    }
    if (isImage) {
      return 'image';
    }
    if (isVideo) {
      return 'video';
    }
    if (isText) {
      return 'text';
    }
    return 'file';
  }, [attachmentUrl, isImage, isText, isVideo, message.type]);
  const canEdit = message.isMine && message.type === 'text' && !message.isDeleted && Boolean(onEdit);
  const canDelete = message.isMine && !message.isDeleted && Boolean(onDelete);
  const canForward = !message.isDeleted && Boolean(onForward)
    && (message.type !== 'listing' || Boolean(message.listingPreview || message.listingId));
  const hasAttachment = Boolean(attachmentViewerKind);
  const { download: downloadAttachmentFile, busy: downloadingAttachment } = useAttachmentDownload(
    attachmentUploadPath,
    attachmentFileName,
  );
  const showMessageMenu = !message.isDeleted && (
    (message.isMine && (canEdit || canDelete || canForward || hasAttachment))
    || (!message.isMine && (canForward || hasAttachment))
  );

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

  const openAttachmentViewer = () => {
    if (attachmentViewerKind) {
      setAttachmentViewerOpen(true);
    }
  };

  const handleAttachmentForward = () => {
    onForward?.(message);
  };

  const handleAttachmentDelete = async () => {
    await handleDelete();
    setAttachmentViewerOpen(false);
  };

  const handleAttachmentDownload = () => {
    setMenuOpen(false);
    void downloadAttachmentFile();
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
        {showMessageMenu && (
          <div className={styles.actions} ref={menuRef}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Действия с сообщением"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
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
                {hasAttachment && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAttachmentDownload}
                    disabled={downloadingAttachment}
                  >
                    {downloadingAttachment ? 'Скачивание…' : 'Скачать'}
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
                onClick={openAttachmentViewer}
                aria-label="Открыть фото"
              >
                <img
                  className={styles.image}
                  src={attachmentUrl}
                  alt={attachmentFileName}
                />
              </button>
            )}

            {isVideo && attachmentUrl && (
              <div className={styles.videoWrap}>
                <video className={styles.video} src={attachmentUrl} controls preload="metadata" />
                <button
                  type="button"
                  className={styles.mediaOpenBtn}
                  onClick={openAttachmentViewer}
                  aria-label="Открыть видео"
                >
                  Открыть
                </button>
              </div>
            )}

            {isText && attachmentUrl && (
              <button
                type="button"
                className={styles.textOpenButton}
                onClick={openAttachmentViewer}
                aria-label="Открыть файл"
              >
                <TextAttachmentPreview src={attachmentUrl} fileName={message.attachmentName} />
              </button>
            )}

            {message.type === 'file' && attachmentUrl && !isImage && !isVideo && !isText && (
              <button
                type="button"
                className={styles.fileOpenButton}
                onClick={openAttachmentViewer}
                aria-label={`Открыть файл ${attachmentFileName}`}
              >
                <ToolbarIcon name="paperclip" accent="var(--color-mint)" motion="float" />
                <span>{attachmentFileName}</span>
              </button>
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

      {attachmentViewerOpen && attachmentUrl && attachmentViewerKind && (
        <AttachmentViewer
          kind={attachmentViewerKind}
          previewUrl={attachmentUrl}
          uploadPath={attachmentUploadPath}
          fileName={attachmentFileName}
          mimeType={message.attachmentMime}
          canForward={canForward}
          canDelete={canDelete}
          onForward={handleAttachmentForward}
          onDelete={handleAttachmentDelete}
          onClose={() => setAttachmentViewerOpen(false)}
        />
      )}
    </div>
  );
}

export {
  MessageBubble,
};
