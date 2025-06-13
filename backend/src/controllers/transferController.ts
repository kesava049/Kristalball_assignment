
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { transferSchema } from '../utils/validator';
import { logger } from '../utils/logger';
import { AuthService } from '../services/authService';

const prisma = new PrismaClient();
const authService = new AuthService();

export class TransferController {
  async createTransfer(req: AuthRequest, res: Response) {
    try {
      const data = transferSchema.parse(req.body);
      
      const transfer = await prisma.transfer.create({
        data: {
          ...data,
          transferDate: new Date(data.transferDate),
          initiatedByUserId: req.user!.id
        },
        include: {
          asset: { include: { equipmentType: true } },
          sourceBase: true,
          destinationBase: true,
          initiatedBy: true
        }
      });

      await authService.logAuditEvent(
        req.user!.id,
        'TRANSFER_INITIATED',
        {
          transferId: transfer.id,
          assetId: data.assetId,
          quantity: data.quantity,
          sourceBaseId: data.sourceBaseId,
          destinationBaseId: data.destinationBaseId
        },
        req.ip,
        'Success'
      );

      res.status(201).json(transfer);
    } catch (error) {
      logger.error('Create transfer error:', error);
      res.status(500).json({ error: 'Failed to create transfer' });
    }
  }

  async getTransfers(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '10', baseId, status, startDate, endDate } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let baseFilter = {};
      if (req.user?.roles.includes('Admin')) {
        if (baseId) {
          baseFilter = {
            OR: [
              { sourceBaseId: baseId as string },
              { destinationBaseId: baseId as string }
            ]
          };
        }
      } else {
        baseFilter = {
          OR: [
            { sourceBaseId: { in: req.user?.bases || [] } },
            { destinationBaseId: { in: req.user?.bases || [] } }
          ]
        };
      }

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
      logger.error('Get transfers error:', error);
      res.status(500).json({ error: 'Failed to fetch transfers' });
    }
  }
}
