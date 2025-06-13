
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          createdAt: true,
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
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        ...user,
        roles: user.userRoles.map(ur => ur.role.roleName),
        bases: user.userBases.map(ub => ({
          id: ub.base.id,
          name: ub.base.baseName
        }))
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { fullName, email } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(fullName && { fullName }),
          ...(email && { email })
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          updatedAt: true
        }
      });

      res.json(user);
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
}
