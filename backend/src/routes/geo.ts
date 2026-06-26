import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { formatAddressLabel, nominatimFetchArray, nominatimFetchOne, REGION_VIEWBOX } from '../services/nominatim.js';
import { isVkMapsEnabled, vkMapsReverse, vkMapsSearch } from '../services/vkMaps.js';

const geoRouter = Router();

geoRouter.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = z.string().trim().min(3).max(200).parse(req.query.q);
    const settlement = typeof req.query.settlement === 'string' ? req.query.settlement.trim() : '';
    const query = settlement ? `${settlement}, ${q}` : q;
    const nearLat = typeof req.query.nearLat === 'string' ? Number(req.query.nearLat) : undefined;
    const nearLng = typeof req.query.nearLng === 'string' ? Number(req.query.nearLng) : undefined;
    const location = Number.isFinite(nearLat) && Number.isFinite(nearLng)
      ? { lat: nearLat as number, lng: nearLng as number }
      : undefined;

    if (isVkMapsEnabled()) {
      try {
        const results = await vkMapsSearch(query, location);
        if (results.length > 0) {
          res.json(results);
          return;
        }
      } catch {
        // fallback to OSM
      }
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '12',
      countrycodes: 'ru',
      viewbox: `${REGION_VIEWBOX.minLon},${REGION_VIEWBOX.maxLat},${REGION_VIEWBOX.maxLon},${REGION_VIEWBOX.minLat}`,
      bounded: '1',
    });

    const raw = await nominatimFetchArray('/search', params);
    const results = raw.map((item) => ({
      label: formatAddressLabel(item),
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    res.json(results);
  } catch (error) {
    next(error);
  }
});

geoRouter.get('/reverse', requireAuth, async (req, res, next) => {
  try {
    const lat = z.coerce.number().min(-90).max(90).parse(req.query.lat);
    const lng = z.coerce.number().min(-180).max(180).parse(req.query.lng);

    if (isVkMapsEnabled()) {
      try {
        const vkResult = await vkMapsReverse(lat, lng);
        if (vkResult) {
          res.json(vkResult);
          return;
        }
      } catch {
        // fallback
      }
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    });

    const item = await nominatimFetchOne('/reverse', params);
    if (!item) {
      res.json({ label: '', address: '', lat, lng });
      return;
    }

    res.json({
      label: formatAddressLabel(item),
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    });
  } catch (error) {
    next(error);
  }
});

export {
  geoRouter,
};
