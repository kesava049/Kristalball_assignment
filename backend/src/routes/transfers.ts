
import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

const createTransferSchema = z.object({
  assetId: z.string().uuid(),
  quantity: z.number().positive(),
  assetSerialNumber: z.string().optional(),
  sourceBaseId: z.string().uuid(),
  destinationBaseId: z.string().uuid(),
  transferDate: z.string(),
  reason: z.string().optional()
});

router.post('/', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  async (req: AuthRequest, res) => {
    try {
      const data = createTransferSchema.parse(req.body);
      
      if (data.sourceBaseId === data.destinationBaseId) {
        return res.status(400).json({ error: 'Source and destination bases cannot be the same' });
      }

      const transfer = await prisma.transfer.create({
        data: {
          ...data,
          transferDate: new Date(data.transferDate),
          initiatedByUserId: req.user!.id,
          status: 'Initiated'
        },
        include: {
          asset: { include: { equipmentType: true } },
          sourceBase: true,
          destinationBase: true,
          initiatedBy: true
        }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'TRANSFER_INITIATED',
          details: JSON.stringify({
            transferId: transfer.id,
            assetId: data.assetId,
            quantity: data.quantity,
            sourceBaseId: data.sourceBaseId,
            destinationBaseId: data.destinationBaseId
          }),
          ipAddress: req.ip,
          status: 'Success'
        }
      });

      res.status(201).json(transfer);
    } catch (error) {
      console.error('Create transfer error:', error);
      res.status(500).json({ error: 'Failed to create transfer' });
    }
  }
);

router.patch('/:id/status', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander']), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: { asset: true }
      });

      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          status,
          ...(status === 'Completed' && {
            completedAt: new Date(),
            receivedByUserId: req.user!.id
          })
        },
        include: {
          asset: { include: { equipmentType: true } },
          sourceBase: true,
          destinationBase: true,
          initiatedBy: true,
          receivedBy: true
        }
      });

      // Update asset balances if transfer is completed and asset is fungible
      if (status === 'Completed' && transfer.asset.isFungible) {
        // Update destination base asset balance
        const destinationAsset = await prisma.asset.findFirst({
          where: {
            equipmentTypeId: transfer.asset.equipmentTypeId,
            currentBaseId: transfer.destinationBaseId
          }
        });

        if (destinationAsset) {
          await prisma.asset.update({
            where: { id: destinationAsset.id },
            data: {
              currentBalance: destinationAsset.currentBalance + transfer.quantity
            }
          });
        }

        // Update source base asset balance
        await prisma.asset.update({
          where: { id: transfer.assetId },
          data: {
            currentBalance: transfer.asset.currentBalance - transfer.quantity
          }
        });
      }

      res.json(updatedTransfer);
    } catch (error) {
      console.error('Update transfer status error:', error);
      res.status(500).json({ error: 'Failed to update transfer status' });
    }
  }
);

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', baseId, status, startDate, endDate } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const baseFilter = req.user?.roles.includes('Admin') 
      ? (baseId ? {
          OR: [
            { sourceBaseId: baseId as string },
            { destinationBaseId: baseId as string }
          ]
        } : {})
      : {
          OR: [
            { sourceBaseId: { in: req.user?.bases || [] } },
            { destinationBaseId: { in: req.user?.bases || [] } }
          ]
        };

    const dateFilter = startDate || endDate ? {
      transferDate: {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      }
    } : {};

    const transfers = await prisma.transfer.findMany({
      skip,
      take: limitNum,
      where: {
        ...baseFilter,
        ...dateFilter,
        ...(status && { status: status as string })
      },
      include: {
        asset: { include: { equipmentType: true } },
        sourceBase: true,
        destinationBase: true,
        initiatedBy: true,
        receivedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.transfer.count({
      where: {
        ...baseFilter,
        ...dateFilter,
        ...(status && { status: status as string })
      }
    });

    res.json({
      transfers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

export default router;
