
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.get('/equipment-types', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      orderBy: { typeName: 'asc' }
    });

    res.json(equipmentTypes);
  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment types' });
  }
});

router.get('/bases', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get bases error:', error);
    res.status(500).json({ error: 'Failed to fetch bases' });
  }
});

router.get('/users', authenticateToken, async (req: AuthRequest, res) => {
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
