import { Router } from 'express';
import healthRouter from './health.js';
import reviewRouter from './review.js';

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(reviewRouter);

export default apiRouter;
