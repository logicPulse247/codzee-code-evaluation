import express from 'express';
import { recordPractice, getWeakSpots } from './practice.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/record', recordPractice);
router.get('/weak-spots/:kitId', getWeakSpots);

export default router;
