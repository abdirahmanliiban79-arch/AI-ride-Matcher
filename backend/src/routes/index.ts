import { Router } from 'express';

import { authRouter } from './auth.routes';
import { driversRouter } from './drivers.routes';
import { healthRouter } from './health.routes';
import { ridesRouter } from './rides.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/drivers', driversRouter);
apiRouter.use('/rides', ridesRouter);