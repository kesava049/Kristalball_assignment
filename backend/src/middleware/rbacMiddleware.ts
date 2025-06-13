
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { logger } from '../utils/logger';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      logger.warn(`Access denied for user ${req.user.id} with roles ${req.user.roles.join(', ')}. Required: ${allowedRoles.join(', ')}`);
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
    logger.warn(`Access denied to base ${baseId} for user ${req.user.id}`);
    return res.status(403).json({ error: 'Access denied to this base' });
  }

  next();
};
