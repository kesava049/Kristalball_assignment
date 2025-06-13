
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { expenditureSchema } from '../utils/validator';
import { logger } from '../utils/logger';
import { AuthService } from '../services/authService';

const prisma = new PrismaClient();
const authService = new AuthService();

export class ExpenditureController {
  async createExpenditure(req: AuthRequest, res: Response) {
    try {
      const data = expenditureSchema.parse(req.body);
      
      const expenditure = await prisma.expenditure.create({
        data: {
          ...data,
          expenditureDate: new Date(data.expenditureDate),
          reportedByUserId: req.user!.id
        },
        include: {
          asset: { include: { equipmentType: true } },
          base: true,
          reportedBy: true
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
            currentBalance: Math.max(0, asset.currentBalance - data.quantityExpended)
          }
        });
      }

      await authService.logAuditEvent(
        req.user!.id,
        'EXPENDITURE_RECORDED',
        {
          expenditureId: expenditure.id,
          assetId: data.assetId,
          quantity: data.quantityExpended,
          baseId: data.baseId
        },
        req.ip,
        'Success'
      );

      res.status(201).json(expenditure);
    } catch (error) {
      logger.error('Create expenditure error:', error);
      res.status(500).json({ error: 'Failed to create expenditure' });
    }
  }

  async getExpenditures(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '10', baseId, startDate, endDate } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const baseFilter = req.user?.roles.includes('Admin') 
        ? (baseId ? { baseId: baseId as string } : {})
        : { baseId: { in: req.user?.bases || [] } };

      const dateFilter = startDate || endDate ? {
        expenditureDate: {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) })
        }
      } : {};

      const expenditures = await prisma.expenditure.findMany({
        skip,
        take: limitNum,
        where: {
          ...baseFilter,
          ...dateFilter
        },
        include: {
          asset: { include: { equipmentType: true } },
          base: true,
          reportedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.expenditure.count({
        where: {
          ...baseFilter,
          ...dateFilter
        }
      });

      res.json({
        expenditures,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get expenditures error:', error);
      res.status(500).json({ error: 'Failed to fetch expenditures' });
    }
  }
}
