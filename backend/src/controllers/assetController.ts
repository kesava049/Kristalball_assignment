
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AssetController {
  async getAssets(req: AuthRequest, res: Response) {
    try {
      const { baseId, equipmentTypeId } = req.query;
      
      const baseFilter = req.user?.roles.includes('Admin') 
        ? (baseId ? { currentBaseId: baseId as string } : {})
        : { currentBaseId: { in: req.user?.bases || [] } };

      const assets = await prisma.asset.findMany({
        where: {
          ...baseFilter,
          ...(equipmentTypeId && { equipmentTypeId: equipmentTypeId as string })
        },
        include: {
          equipmentType: true,
          currentBase: true
        },
        orderBy: { modelName: 'asc' }
      });

      res.json(assets);
    } catch (error) {
      logger.error('Get assets error:', error);
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  }

  async getEquipmentTypes(req: AuthRequest, res: Response) {
    try {
      const equipmentTypes = await prisma.equipmentType.findMany({
        orderBy: { typeName: 'asc' }
      });

      res.json(equipmentTypes);
    } catch (error) {
      logger.error('Get equipment types error:', error);
      res.status(500).json({ error: 'Failed to fetch equipment types' });
    }
  }

  async getBases(req: AuthRequest, res: Response) {
    try {
      const baseFilter = req.user?.roles.includes('Admin') 
        ? {}
        : { id: { in: req.user?.bases || [] } };

      const bases = await prisma.base.findMany({
        where: baseFilter,
        orderBy: { baseName: 'asc' }
      });

      res.json(bases);
    } catch (error) {
      logger.error('Get bases error:', error);
      res.status(500).json({ error: 'Failed to fetch bases' });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const { baseId } = req.query;
      
      let userFilter = {};
      
      if (baseId) {
        userFilter = {
          userBases: {
            some: {
              baseId: baseId as string
            }
          }
        };
      } else if (!req.user?.roles.includes('Admin')) {
        userFilter = {
          userBases: {
            some: {
              baseId: { in: req.user?.bases || [] }
            }
          }
        };
      }

      const users = await prisma.user.findMany({
        where: userFilter,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true
        },
        orderBy: { fullName: 'asc' }
      });

      res.json(users);
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
}
