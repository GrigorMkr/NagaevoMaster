import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { upgradeInsecureHttpInText } from '../utils/secureUrl.js';

const newsRouter = Router();
const LOCAL_RSS_URL = 'https://nagaevodk.ru/category/news/feed/';

newsRouter.get('/feed', async (_req, res, next) => {
    try {
        const response = await fetch(LOCAL_RSS_URL, {
            headers: { 'User-Agent': 'NagaevoMaster/1.0' },
        });
        if (!response.ok) {
            throw new HttpError(502, 'RSS-лента временно недоступна');
        }
        const xml = upgradeInsecureHttpInText(await response.text());
        res.set('Cache-Control', 'public, max-age=300');
        res.type('application/xml').send(xml);
    }
    catch (error) {
        next(error);
    }
});

export {
  newsRouter,
};
