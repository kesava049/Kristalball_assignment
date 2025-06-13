
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { assignmentSchema } from '../utils/validator';
import { logger } from '../utils/logger';
import { AuthService } from '../services/authService';

const prisma = new PrismaClient();
const authService = new AuthService();

export class AssignmentController {
  async createAssignment(req: AuthRequest, res: Response) {
    try {
      const data = assignmentSchema.parse(req.body);
      
      const assignment = await prisma.assignment.create({
        data: {
          ...data,
          assignmentDate: new Date(data.assignmentDate),
          expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
          recordedByUserId: req.user!.id
        },
        include: {
          asset: { include: { equipmentType: true } },
          assignedTo: true,
          baseOfAssignment: true,
          recordedBy: true
        }
      });

      await authService.logAuditEvent(
        req.user!.id,
        'ASSET_ASSIGNED',
        {
          assignmentId: assignment.id,
          assetId: data.assetId,
          assignedToUserId: data.assignedToUserId,
          baseId: data.baseOfAssignmentId
        },
        req.ip,
        'Success'
      );

      res.status(201).json(assignment);
    } catch (error) {
      logger.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }

  async returnAssignment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          returnedDate: new Date(),
          isActive: false
        },
        include: {
          asset: { include: { equipmentType: true } },
          assignedTo: true,
          baseOfAssignment: true,
          recordedBy: true
        }
      });

      await authService.logAuditEvent(
        req.user!.id,
        'ASSET_RETURNED',
        {
          assignmentId: assignment.id,
          assetId: assignment.assetId
        },
        req.ip,
        'Success'
      );

      res.json(assignment);
    } catch (error) {
      logger.error('Return assignment error:', error);
      res.status(500).json({ error: 'Failed to return assignment' });
    }
  }

  async getAssignments(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '10', baseId, isActive, userId } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const baseFilter = req.user?.roles.includes('Admin') 
        ? (baseId ? { baseOfAssignmentId: baseId as string } : {})
        : { baseOfAssignmentId: { in: req.user?.bases || [] } };

      const assignments = await prisma.assignment.findMany({
        skip,
        take: limitNum,
        where: {
          ...baseFilter,
          ...(isActive !== undefined && { isActive: isActive === 'true' }),
          ...(userId && { assignedToUserId: userId as string })
        },
        include: {
          asset: { include: { equipmentType: true } },
          assignedTo: true,
          baseOfAssignment: true,
          recordedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.assignment.count({
        where: {
          ...baseFilter,
          ...(isActive !== undefined && { isActive: isActive === 'true' }),
          ...(userId && { assignedToUserId: userId as string })
        }
      });

      res.json({
        assignments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get assignments error:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  }
}
