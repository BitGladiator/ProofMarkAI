import { Router } from 'express';
import { executeReview } from '../services/review_service.js';

const router = Router();

/**
 * Main review endpoint.
 * POST /api/review
 */
router.post('/review', async (req, res, next) => {
  try {
    const result = await executeReview(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
