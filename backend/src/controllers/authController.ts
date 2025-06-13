
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerSchema } from '../utils/validator';
import { logger } from '../utils/logger';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await authService.validateUser(username, password);

      if (!user) {
        await authService.logAuditEvent('', 'LOGIN_FAILED', { username }, req.ip, 'Failure');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = authService.generateToken(user.id);

      await authService.logAuditEvent(user.id, 'USER_LOGIN', { username }, req.ip, 'Success');

      res.json({
        token,
        user
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const userData = registerSchema.parse(req.body);

      const user = await authService.createUser(userData);

      await authService.logAuditEvent(user.id, 'USER_REGISTERED', { username: userData.username }, req.ip, 'Success');

      res.status(201).json({
        message: 'User created successfully',
        userId: user.id
      });
    } catch (error) {
      logger.error('Registration error:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }
}
