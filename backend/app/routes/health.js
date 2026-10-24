import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint.
 * Returns service status without exposing sensitive credentials or stack traces.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ProofMark AI Backend'
  });
});

export default router;
