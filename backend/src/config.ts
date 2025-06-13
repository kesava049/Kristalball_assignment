
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  bcryptRounds: 10,
  jwtExpiresIn: '24h'
};
