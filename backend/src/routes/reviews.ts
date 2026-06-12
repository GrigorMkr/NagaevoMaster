import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { toReviewResponse } from '../utils/mappers.js'
import { routeParam } from '../utils/params.js'

export const reviewsRouter = Router({ mergeParams: true })

function listingIdFrom(req: { params: Record<string, string | string[]> }): string {
  return routeParam(req.params.listingId)
}

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
})

const replySchema = z.object({
  masterReply: z.string().min(1).max(2000),
})

async function recalculateListingRating(listingId: string) {
  const reviews = await prisma.review.findMany({ where: { listingId } })
  const reviewsCount = reviews.length
  const rating =
    reviewsCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount

  await prisma.listing.update({
    where: { id: listingId },
    data: { rating, reviewsCount },
  })
}

reviewsRouter.get('/', async (req, res, next) => {
  try {
    const listingId = listingIdFrom(req)
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      throw new HttpError(404, 'Объявление не найдено')
    }

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json(reviews.map(toReviewResponse))
  } catch (error) {
    next(error)
  }
})

reviewsRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const listingId = listingIdFrom(req)
    const data = createReviewSchema.parse(req.body)

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing || listing.status !== 'published') {
      throw new HttpError(404, 'Объявление не найдено')
    }

    const existing = await prisma.review.findFirst({
      where: { listingId, userId: req.user!.id },
    })
    if (existing) {
      throw new HttpError(409, 'Вы уже оставляли отзыв к этому объявлению')
    }

    const review = await prisma.review.create({
      data: {
        listingId,
        userId: req.user!.id,
        rating: data.rating,
        text: data.text,
      },
      include: { user: { select: { name: true } } },
    })

    await recalculateListingRating(listingId)
    res.status(201).json(toReviewResponse(review))
  } catch (error) {
    next(error)
  }
})

reviewsRouter.patch('/:reviewId/reply', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const listingId = listingIdFrom(req)
    const reviewId = routeParam(req.params.reviewId ?? '')
    const data = replySchema.parse(req.body)

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      throw new HttpError(404, 'Объявление не найдено')
    }

    const isOwner = listing.userId === req.user!.id
    const isModerator = ['moderator', 'admin'].includes(req.user!.role)
    if (!isOwner && !isModerator) {
      throw new HttpError(403, 'Ответить может только владелец объявления')
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { masterReply: data.masterReply },
      include: { user: { select: { name: true } } },
    })

    res.json(toReviewResponse(review))
  } catch (error) {
    next(error)
  }
})
