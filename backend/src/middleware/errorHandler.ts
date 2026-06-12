import type { NextFunction, Request, Response } from 'express';
class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}
function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
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
