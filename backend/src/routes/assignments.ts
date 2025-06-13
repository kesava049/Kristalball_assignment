
import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

const createAssignmentSchema = z.object({
  assetId: z.string().uuid(),
  assignedToUserId: z.string().uuid(),
  assignmentDate: z.string(),
  baseOfAssignmentId: z.string().uuid(),
  purpose: z.string().optional(),
  expectedReturnDate: z.string().optional()
});

router.post('/', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  async (req: AuthRequest, res) => {
    try {
      const data = createAssignmentSchema.parse(req.body);
      
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

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ASSET_ASSIGNED',
          details: JSON.stringify({
            assignmentId: assignment.id,
            assetId: data.assetId,
            assignedToUserId: data.assignedToUserId,
            baseId: data.baseOfAssignmentId
          }),
          ipAddress: req.ip,
          status: 'Success'
        }
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }
);

router.patch('/:id/return', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  async (req: AuthRequest, res) => {
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

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ASSET_RETURNED',
          details: JSON.stringify({
            assignmentId: assignment.id,
            assetId: assignment.assetId
          }),
          ipAddress: req.ip,
          status: 'Success'
        }
      });

      res.json(assignment);
    } catch (error) {
      console.error('Return assignment error:', error);
      res.status(500).json({ error: 'Failed to return assignment' });
    }
  }
);

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

export default router;
