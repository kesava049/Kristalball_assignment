
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthService {
  async validateUser(username: string, password: string) {
    try {
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
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.userRoles.map(ur => ur.role.roleName),
        bases: user.userBases.map(ub => ({
          id: ub.base.id,
          name: ub.base.baseName
        }))
      };
    } catch (error) {
      logger.error('Error validating user:', error);
      throw error;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, config.bcryptRounds);

      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          fullName: userData.fullName
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

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  verifyToken(token: string): { userId: string } {
    return jwt.verify(token, config.jwtSecret) as { userId: string };
  }

  async logAuditEvent(userId: string, action: string, details: any, ipAddress: string, status: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: JSON.stringify(details),
          ipAddress,
          status
        }
      });
    } catch (error) {
      logger.error('Error logging audit event:', error);
    }
  }
}
