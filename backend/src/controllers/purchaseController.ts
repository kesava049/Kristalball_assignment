
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { purchaseSchema } from '../utils/validator';
import { logger } from '../utils/logger';
import { AuthService } from '../services/authService';

const prisma = new PrismaClient();
const authService = new AuthService();

export class PurchaseController {
  async createPurchase(req: AuthRequest, res: Response) {
    try {
      const data = purchaseSchema.parse(req.body);
      
      const purchase = await prisma.purchase.create({
        data: {
          ...data,
          purchaseDate: new Date(data.purchaseDate),
          recordedByUserId: req.user!.id
        },
        include: {
          asset: { include: { equipmentType: true } },
          receivingBase: true,
          recordedBy: true
        }
      });

      // Update asset balance if fungible
      const asset = await prisma.asset.findUnique({
        where: { id: data.assetId }
      });

      if (asset?.isFungible) {
        await prisma.asset.update({
          where: { id: data.assetId },
          data: {
            currentBalance: asset.currentBalance + data.quantity
          }
        });
      }

      await authService.logAuditEvent(
        req.user!.id,
        'PURCHASE_CREATED',
        {
          purchaseId: purchase.id,
          assetId: data.assetId,
          quantity: data.quantity,
          baseId: data.receivingBaseId
        },
        req.ip,
        'Success'
      );

      res.status(201).json(purchase);
    } catch (error) {
      logger.error('Create purchase error:', error);
      res.status(500).json({ error: 'Failed to create purchase' });
    }
  }

  async getPurchases(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '10', baseId, equipmentTypeId, startDate, endDate } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const baseFilter = req.user?.roles.includes('Admin') 
        ? (baseId ? { receivingBaseId: baseId as string } : {})
        : { receivingBaseId: { in: req.user?.bases || [] } };

      const dateFilter = startDate || endDate ? {
        purchaseDate: {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) })
        }
      } : {};

      const purchases = await prisma.purchase.findMany({
        skip,
        take: limitNum,
        where: {
          ...baseFilter,
          ...dateFilter,
          ...(equipmentTypeId && { asset: { equipmentTypeId: equipmentTypeId as string } })
        },
        include: {
          asset: { include: { equipmentType: true } },
          receivingBase: true,
          recordedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.purchase.count({
        where: {
          ...baseFilter,
          ...dateFilter,
          ...(equipmentTypeId && { asset: { equipmentTypeId: equipmentTypeId as string } })
        }
      });

      res.json({
        purchases,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get purchases error:', error);
      res.status(500).json({ error: 'Failed to fetch purchases' });
    }
  }
}
