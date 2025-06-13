
import express from 'express';
import { AuthController } from '../controllers/authController';
import { AssetController } from '../controllers/assetController';
import { PurchaseController } from '../controllers/purchaseController';
import { TransferController } from '../controllers/transferController';
import { AssignmentController } from '../controllers/assignmentController';
import { ExpenditureController } from '../controllers/expenditureController';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole, requireBaseAccess } from '../middleware/rbacMiddleware';

const router = express.Router();

// Controllers
const authController = new AuthController();
const assetController = new AssetController();
const purchaseController = new PurchaseController();
const transferController = new TransferController();
const assignmentController = new AssignmentController();
const expenditureController = new ExpenditureController();
const userController = new UserController();

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Asset routes
router.get('/assets', authenticateToken, assetController.getAssets);
router.get('/assets/equipment-types', authenticateToken, assetController.getEquipmentTypes);
router.get('/assets/bases', authenticateToken, assetController.getBases);
router.get('/assets/users', authenticateToken, assetController.getUsers);

// Purchase routes
router.post('/purchases', 
  authenticateToken, 
  requireRole(['Admin', 'Logistics Officer']), 
  purchaseController.createPurchase
);
router.get('/purchases', authenticateToken, purchaseController.getPurchases);

// Transfer routes
router.post('/transfers', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  transferController.createTransfer
);
router.get('/transfers', authenticateToken, transferController.getTransfers);

// Assignment routes
router.post('/assignments', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  assignmentController.createAssignment
);
router.patch('/assignments/:id/return', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  assignmentController.returnAssignment
);
router.get('/assignments', authenticateToken, assignmentController.getAssignments);

// Expenditure routes
router.post('/expenditures', 
  authenticateToken, 
  requireRole(['Admin', 'Base Commander', 'Logistics Officer']), 
  expenditureController.createExpenditure
);
router.get('/expenditures', authenticateToken, expenditureController.getExpenditures);

// User routes
router.get('/user/profile', authenticateToken, userController.getProfile);
router.put('/user/profile', authenticateToken, userController.updateProfile);

export default router;
