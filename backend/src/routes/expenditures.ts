
import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

const createExpenditureSchema = z.object({
  assetId: z.string().uuid(),
  quantityExpended: z.number().positive(),
  expenditureDate: z.string(),
  baseId: z.string().uuid(),
  reason: z.string().optional()
});

router.post('/', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  async (req: AuthRequest, res) => {
    try {
      const data = createExpenditureSchema.parse(req.body);
      
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

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'EXPENDITURE_RECORDED',
          details: JSON.stringify({
            expenditureId: expenditure.id,
            assetId: data.assetId,
            quantity: data.quantityExpended,
            baseId: data.baseId
          }),
          ipAddress: req.ip,
          status: 'Success'
        }
      });

      res.status(201).json(expenditure);
    } catch (error) {
      console.error('Create expenditure error:', error);
      res.status(500).json({ error: 'Failed to create expenditure' });
    }
  }
);

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get expenditures error:', error);
    res.status(500).json({ error: 'Failed to fetch expenditures' });
  }
});

export default router;
