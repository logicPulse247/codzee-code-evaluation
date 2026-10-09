import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import kitsRoutes from './modules/kits/kits.routes.js';
import practiceRoutes from './modules/practice/practice.routes.js';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Auth, Kits, & Practice Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitsRoutes);
app.use('/api/practice', practiceRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Interview Prep Kit API',
    timestamp: new Date().toISOString()
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
