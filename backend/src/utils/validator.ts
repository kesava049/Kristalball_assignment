
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required')
});

export const purchaseSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
  purchaseDate: z.string(),
  supplierInfo: z.string().optional(),
  receivingBaseId: z.string().uuid('Invalid base ID'),
  purchaseOrderNumber: z.string().optional()
});

export const transferSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  quantity: z.number().positive('Quantity must be positive'),
  sourceBaseId: z.string().uuid('Invalid source base ID'),
  destinationBaseId: z.string().uuid('Invalid destination base ID'),
  transferDate: z.string(),
  reason: z.string().optional()
});

export const assignmentSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  assignedToUserId: z.string().uuid('Invalid user ID'),
  assignmentDate: z.string(),
  baseOfAssignmentId: z.string().uuid('Invalid base ID'),
  purpose: z.string().optional(),
  expectedReturnDate: z.string().optional()
});

export const expenditureSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  quantityExpended: z.number().positive('Quantity must be positive'),
  expenditureDate: z.string(),
  baseId: z.string().uuid('Invalid base ID'),
  reason: z.string().optional()
});
