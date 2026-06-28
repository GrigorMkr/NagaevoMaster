import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}
function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ message: 'Файл слишком большой для отправки в чат (максимум 50 МБ)' });
            return;
        }
        res.status(400).json({ message: 'Не удалось загрузить файл' });
        return;
    }
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    console.error(error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}

export {
  HttpError,
  errorHandler,
}
