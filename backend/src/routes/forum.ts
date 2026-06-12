import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { routeParam } from '../utils/params.js'

export const forumRouter = Router()

const createTopicSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  category: z.string().min(1),
})

const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
})

function toTopicListItem(topic: {
  id: string
  title: string
  category: string
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  author: { name: string }
  posts: { createdAt: Date }[]
}) {
  const lastPostAt = topic.posts[0]?.createdAt ?? topic.updatedAt
  return {
    id: topic.id,
    title: topic.title,
    category: topic.category,
    authorName: topic.author.name,
    postsCount: topic.posts.length,
    lastPostAt: lastPostAt.toISOString(),
    isPinned: topic.isPinned,
    createdAt: topic.createdAt.toISOString(),
  }
}

forumRouter.get('/topics', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const topics = await prisma.forumTopic.findMany({
      where: category ? { category } : undefined,
      include: {
        author: { select: { name: true } },
        posts: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })

    res.json(topics.map(toTopicListItem))
  } catch (error) {
    next(error)
  }
})

forumRouter.get('/topics/:id', async (req, res, next) => {
  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { id: routeParam(req.params.id) },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        posts: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!topic) {
      throw new HttpError(404, 'Тема не найдена')
    }

    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } },
    })

    res.json({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      content: topic.content,
      authorName: topic.author.name,
      postsCount: topic.posts.length,
      lastPostAt: (topic.posts.at(-1)?.createdAt ?? topic.updatedAt).toISOString(),
      isPinned: topic.isPinned,
      isClosed: topic.isClosed,
      viewCount: topic.viewCount + 1,
      createdAt: topic.createdAt.toISOString(),
      posts: topic.posts.map((post) => ({
        id: post.id,
        content: post.content,
        authorName: post.author.name,
        likes: post.likes,
        createdAt: post.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    next(error)
  }
})

forumRouter.post('/topics', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = createTopicSchema.parse(req.body)
    const topic = await prisma.forumTopic.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: req.user!.id,
      },
      include: {
        author: { select: { name: true } },
        posts: true,
      },
    })

    res.status(201).json(toTopicListItem({ ...topic, posts: [] }))
  } catch (error) {
    next(error)
  }
})

forumRouter.post('/topics/:id/replies', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = createReplySchema.parse(req.body)
    const topic = await prisma.forumTopic.findUnique({ where: { id: routeParam(req.params.id) } })
    if (!topic) {
      throw new HttpError(404, 'Тема не найдена')
    }
    if (topic.isClosed) {
      throw new HttpError(403, 'Тема закрыта для ответов')
    }

    const post = await prisma.forumPost.create({
      data: {
        topicId: topic.id,
        authorId: req.user!.id,
        content: data.content,
      },
      include: {
        author: { select: { name: true } },
      },
    })

    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { updatedAt: new Date() },
    })

    res.status(201).json({
      id: post.id,
      content: post.content,
      authorName: post.author.name,
      likes: post.likes,
      createdAt: post.createdAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})
