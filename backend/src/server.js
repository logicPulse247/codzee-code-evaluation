import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      `Server running on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
  });
};

startServer();