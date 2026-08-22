// src/routes/index.js

import { Router } from 'express';
import healthRouter from './health.js';
import itemsRouter from './items.js';
import pdfRouter from './pdf.js';

const router = Router();

router.use(healthRouter);
router.use('/items', itemsRouter);
router.use(pdfRouter);

export default router;