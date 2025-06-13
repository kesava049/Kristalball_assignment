
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1)
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        userBases: {
          include: {
            base: true
          }
        }
      }
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: JSON.stringify({ username }),
        ipAddress: req.ip,
        status: 'Success'
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.userRoles.map(ur => ur.role.roleName),
        bases: user.userBases.map(ub => ({
          id: ub.base.id,
          name: ub.base.baseName
        }))
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = registerSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        fullName
      }
    });

    // Assign default role (Logistics Officer)
    const defaultRole = await prisma.role.findFirst({
      where: { roleName: 'Logistics Officer' }
    });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id
        }
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
