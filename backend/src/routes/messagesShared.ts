import { HttpError } from '../middleware/errorHandler.js';
import { assertOwnedUpload } from '../utils/uploadUrl.js';

const MESSAGE_TYPES = ['text', 'file', 'voice', 'listing'] as const;
type MessageType = (typeof MESSAGE_TYPES)[number];

function isStaffRole(role: string) {
  return role === 'admin' || role === 'moderator';
}

function formatMessagePreview(message: {
  type: string;
  body: string;
  attachmentName: string | null;
  attachmentMime: string | null;
  deletedAt?: Date | null;
}) {
  if (message.deletedAt) {
    return 'Сообщение удалено';
  }
  if (message.type === 'listing') {
    return 'Объявление';
  }
  if (message.type === 'voice') {
    return 'Голосовое сообщение';
  }
  if (message.type === 'file') {
    if (message.attachmentMime?.startsWith('image/')) {
      return 'Фото';
    }
    if (message.attachmentMime?.startsWith('video/')) {
      return 'Видео';
    }
    return message.attachmentName || 'Файл';
  }
  return message.body;
}

function toMessageResponse(
  message: {
    id: string;
    type: string;
    body: string;
    attachmentUrl: string | null;
    attachmentName: string | null;
    attachmentMime: string | null;
    senderId: string;
    sender: { name: string; role: string };
    createdAt: Date;
    readAt: Date | null;
    editedAt?: Date | null;
    deletedAt?: Date | null;
    isForwarded?: boolean;
    listingId?: string | null;
    listing?: {
      id: string;
      title: string;
      kind: string;
      priceFrom: number;
      unit: string;
      images: string;
      status: string;
    } | null;
  },
  currentUserId: string,
) {
  const isDeleted = message.deletedAt != null;
  let listingPreview: {
    id: string;
    title: string;
    kind: string;
    priceFrom: number;
    unit: string;
    image?: string;
  } | undefined;
  if (!isDeleted && message.type === 'listing' && message.listing && message.listing.status === 'published') {
    let images: string[] = [];
    try {
      const parsed = JSON.parse(message.listing.images) as unknown;
      images = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      images = [];
    }
    listingPreview = {
      id: message.listing.id,
      title: message.listing.title,
      kind: message.listing.kind,
      priceFrom: message.listing.priceFrom,
      unit: message.listing.unit,
      image: images[0],
    };
  }
  return {
    id: message.id,
    type: message.type as MessageType,
    body: isDeleted ? '' : message.body,
    attachmentUrl: isDeleted ? undefined : (message.attachmentUrl ?? undefined),
    attachmentName: isDeleted ? undefined : (message.attachmentName ?? undefined),
    attachmentMime: isDeleted ? undefined : (message.attachmentMime ?? undefined),
    listingId: isDeleted ? undefined : (message.listingId ?? undefined),
    listingPreview,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role,
    senderIsStaff: isStaffRole(message.sender.role),
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString(),
    editedAt: message.editedAt?.toISOString(),
    isDeleted,
    isForwarded: Boolean(message.isForwarded),
    isMine: message.senderId === currentUserId,
  };
}

export {
  MESSAGE_TYPES,
  type MessageType,
  formatMessagePreview,
  assertOwnedUpload,
  toMessageResponse,
  isStaffRole,
};
