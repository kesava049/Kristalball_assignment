
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
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
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireBaseAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admins have access to all bases
  if (req.user.roles.includes('Admin')) {
    return next();
  }

  const baseId = req.params.baseId || req.body.baseId || req.query.baseId;
  
  if (baseId && !req.user.bases.includes(baseId)) {
    return res.status(403).json({ error: 'Access denied to this base' });
  }

  next();
};
