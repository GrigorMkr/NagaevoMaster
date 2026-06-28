import { Router } from 'express';
import { buildSiteIntegrations } from '../services/siteIntegrations.js';

const siteRouter = Router();

siteRouter.get('/integrations', (_req, res) => {
  res.json(buildSiteIntegrations());
});

export {
  siteRouter,
};
