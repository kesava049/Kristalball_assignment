
import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

const createPurchaseSchema = z.object({
  assetId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
  purchaseDate: z.string(),
  supplierInfo: z.string().optional(),
  receivingBaseId: z.string().uuid(),
  purchaseOrderNumber: z.string().optional()
});

router.post('/', 
  authenticateToken, 
  requireRole(['Admin', 'Logistics Officer']), 
  async (req: AuthRequest, res) => {
    try {
      const data = createPurchaseSchema.parse(req.body);
      
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

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'PURCHASE_CREATED',
          details: JSON.stringify({
            purchaseId: purchase.id,
            assetId: data.assetId,
            quantity: data.quantity,
            baseId: data.receivingBaseId
          }),
          ipAddress: req.ip,
          status: 'Success'
        }
      });

      res.status(201).json(purchase);
    } catch (error) {
      console.error('Create purchase error:', error);
      res.status(500).json({ error: 'Failed to create purchase' });
    }
  }
);

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

export default router;
