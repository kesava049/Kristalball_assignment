
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/api';
import dashboardRoutes from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './utils/seed';
import { logger } from './utils/logger';
import { config } from './config';

const app = express();

export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Seed the database with initial data
    await seedDatabase();
    logger.info('Database seeded successfully');
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
