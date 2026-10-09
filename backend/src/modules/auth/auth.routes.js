import express from 'express';
import { register, login, logout, me } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
