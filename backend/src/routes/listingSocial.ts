import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { getOrCreateConversationForUsers, recordListingRepost, sendListingMessage } from '../services/listingRepost.js';

const listingSocialRouter = Router();

const reactionSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

const repostSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1).max(30),
});

listingSocialRouter.get('/reactions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const reactions = await prisma.listingReaction.findMany({
      where: { userId: req.user!.id },
      select: { listingId: true, value: true },
    });
    const map: Record<string, 1 | -1> = {};
    for (const item of reactions) {
      if (item.value === 1 || item.value === -1) {
        map[item.listingId] = item.value;
      }
    }
    res.json(map);
  } catch (error) {
    next(error);
  }
});

listingSocialRouter.put('/:listingId/reaction', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const listingId = routeParam(req.params.listingId);
    const { value } = reactionSchema.parse(req.body);
    const userId = req.user!.id;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: 'published' },
    });
    if (!listing) {
      throw new HttpError(404, 'Объявление не найдено');
    }
    if (listing.userId === userId) {
      throw new HttpError(400, 'Нельзя оценивать своё объявление');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.listingReaction.findUnique({
        where: { userId_listingId: { userId, listingId } },
      });

      let likesDelta = 0;
      let dislikesDelta = 0;

      if (value === 0) {
        if (existing) {
          if (existing.value === 1) likesDelta = -1;
          if (existing.value === -1) dislikesDelta = -1;
          await tx.listingReaction.delete({
            where: { userId_listingId: { userId, listingId } },
          });
        }
      } else if (!existing) {
        if (value === 1) likesDelta = 1;
        else dislikesDelta = 1;
        await tx.listingReaction.create({
          data: { userId, listingId, value },
        });
      } else if (existing.value !== value) {
        if (existing.value === 1) {
          likesDelta = -1;
          dislikesDelta = 1;
        } else {
          likesDelta = 1;
          dislikesDelta = -1;
        }
        await tx.listingReaction.update({
          where: { userId_listingId: { userId, listingId } },
          data: { value },
        });
      }

      if (likesDelta !== 0 || dislikesDelta !== 0) {
        await tx.listing.update({
          where: { id: listingId },
          data: {
            likesCount: { increment: likesDelta },
            dislikesCount: { increment: dislikesDelta },
          },
        });
      }

      return tx.listing.findUniqueOrThrow({ where: { id: listingId } });
    });

    res.json({
      listingId,
      value: value === 0 ? null : value,
      likesCount: result.likesCount,
      dislikesCount: result.dislikesCount,
    });
  } catch (error) {
    next(error);
  }
});

listingSocialRouter.post('/:listingId/repost', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const listingId = routeParam(req.params.listingId);
    const { recipientIds } = repostSchema.parse(req.body);
    const senderId = req.user!.id;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: 'published' },
    });
    if (!listing) {
      throw new HttpError(404, 'Объявление не найдено');
    }

    const uniqueRecipients = [...new Set(recipientIds)];
    const sent: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const recipientId of uniqueRecipients) {
        if (recipientId !== senderId) {
          const friendship = await tx.friendship.findFirst({
            where: {
              status: 'accepted',
              OR: [
                { requesterId: senderId, addresseeId: recipientId },
                { requesterId: recipientId, addresseeId: senderId },
              ],
            },
          });
          if (!friendship) {
            throw new HttpError(403, 'Репост доступен только себе и друзьям');
          }
        }

        const conversation = await getOrCreateConversationForUsers(
          tx,
          senderId,
          recipientId,
          req.user!.role,
        );

        await sendListingMessage(tx, {
          conversationId: conversation.id,
          senderId,
          listingId,
        });

        await recordListingRepost(tx, {
          listingId,
          senderId,
          recipientId,
        });

        sent.push(recipientId);
      }
    });

    const updated = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });

    res.status(201).json({
      listingId,
      recipientIds: sent,
      repostsCount: updated.repostsCount,
    });
  } catch (error) {
    next(error);
  }
});

export {
  listingSocialRouter,
};
