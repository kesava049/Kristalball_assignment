
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { FilterParams } from '../types';

const router = express.Router();

router.get('/metrics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId } = req.query as FilterParams;
    
    // Base filter for user access
    const baseFilter = req.user?.roles.includes('Admin') 
      ? (baseId ? { id: baseId } : {})
      : { id: { in: req.user?.bases || [] } };

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) })
    };

    // Calculate opening balance (assets at start of period)
    const openingBalance = await prisma.asset.aggregate({
      _sum: { currentBalance: true },
      where: {
        currentBase: baseFilter,
        ...(equipmentTypeId && { equipmentTypeId })
      }
    });

    // Calculate purchases in period
    const purchases = await prisma.purchase.aggregate({
      _sum: { quantity: true },
      where: {
        receivingBase: baseFilter,
        ...(equipmentTypeId && { asset: { equipmentTypeId } }),
        ...(Object.keys(dateFilter).length && { purchaseDate: dateFilter })
      }
    });

    // Calculate transfers in
    const transfersIn = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: {
        destinationBase: baseFilter,
        status: 'Completed',
        ...(equipmentTypeId && { asset: { equipmentTypeId } }),
        ...(Object.keys(dateFilter).length && { completedAt: dateFilter })
      }
    });

    // Calculate transfers out
    const transfersOut = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: {
        sourceBase: baseFilter,
        status: 'Completed',
        ...(equipmentTypeId && { asset: { equipmentTypeId } }),
        ...(Object.keys(dateFilter).length && { completedAt: dateFilter })
      }
    });

    // Calculate expenditures
    const expenditures = await prisma.expenditure.aggregate({
      _sum: { quantityExpended: true },
      where: {
        base: baseFilter,
        ...(equipmentTypeId && { asset: { equipmentTypeId } }),
        ...(Object.keys(dateFilter).length && { expenditureDate: dateFilter })
      }
    });

    // Calculate assigned assets
    const assignedAssets = await prisma.assignment.aggregate({
      _count: { id: true },
      where: {
        isActive: true,
        baseOfAssignment: baseFilter,
        ...(equipmentTypeId && { asset: { equipmentTypeId } })
      }
    });

    const openingBalanceValue = openingBalance._sum.currentBalance || 0;
    const purchasesValue = purchases._sum.quantity || 0;
    const transfersInValue = transfersIn._sum.quantity || 0;
    const transfersOutValue = transfersOut._sum.quantity || 0;
    const expendituresValue = expenditures._sum.quantityExpended || 0;

    const netMovement = purchasesValue + transfersInValue - transfersOutValue;
    const closingBalance = openingBalanceValue + netMovement - expendituresValue;

    res.json({
      openingBalance: openingBalanceValue,
      closingBalance,
      netMovement,
      assignedAssets: assignedAssets._count.id,
      expendedAssets: expendituresValue,
      breakdown: {
        purchases: purchasesValue,
        transfersIn: transfersInValue,
        transfersOut: transfersOutValue
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

router.get('/recent-activities', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const baseFilter = req.user?.roles.includes('Admin') 
      ? {}
      : { id: { in: req.user?.bases || [] } };

    const [recentPurchases, recentTransfers, recentAssignments] = await Promise.all([
      prisma.purchase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { receivingBase: baseFilter },
        include: {
          asset: { include: { equipmentType: true } },
          receivingBase: true,
          recordedBy: true
        }
      }),
      prisma.transfer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            { sourceBase: baseFilter },
            { destinationBase: baseFilter }
          ]
        },
        include: {
          asset: { include: { equipmentType: true } },
          sourceBase: true,
          destinationBase: true,
          initiatedBy: true
        }
      }),
      prisma.assignment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { baseOfAssignment: baseFilter },
        include: {
          asset: { include: { equipmentType: true } },
          assignedTo: true,
          baseOfAssignment: true
        }
      })
    ]);

    res.json({
      recentPurchases,
      recentTransfers,
      recentAssignments
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

export default router;
