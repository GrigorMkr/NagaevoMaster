import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export const contactRouter = Router()

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
})

contactRouter.post('/', async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body)
    await prisma.contactMessage.create({ data })
    res.status(201).json({ message: 'Сообщение отправлено' })
  } catch (error) {
    next(error)
  }
})
