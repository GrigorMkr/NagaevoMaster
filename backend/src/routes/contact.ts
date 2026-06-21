import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { sendContactMessageEmail } from '../services/notify/email.js';

const contactRouter = Router();

const contactSchema = z.object({
  message: z.string().min(10),
});

contactRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { message } = contactSchema.parse(req.body);
    const user = req.user!;
    const data = {
      name: user.name,
      email: user.email,
      message,
    };

    await prisma.contactMessage.create({ data });

    void sendContactMessageEmail(data).catch((error) => {
      console.error('[email:contact] failed', error);
    });

    res.status(201).json({ message: 'Сообщение отправлено' });
  } catch (error) {
    next(error);
  }
});

export {
  contactRouter,
};
