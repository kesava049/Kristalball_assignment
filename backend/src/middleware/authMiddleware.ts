
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = authService.verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        userBases: {
          include: {
            base: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.userRoles.map(ur => ur.role.roleName),
      bases: user.userBases.map(ub => ub.base.id)
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};
