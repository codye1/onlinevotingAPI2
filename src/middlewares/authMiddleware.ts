import TokenService from '../service/TokenService';
import Send from '../utils/Send';
import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return Send.unauthorized(res, null, 'No authorization header provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return Send.unauthorized(res, null, 'No token provided');
    }

    const tokenData = TokenService.verifyAccessToken(token);

    if (!tokenData || typeof tokenData.userId !== 'string') {
      return Send.unauthorized(res, null, 'Invalid token');
    }

    req.userId = tokenData.userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    const err = error as { name?: string } | undefined;
    const errorName = err && typeof err === 'object' ? err.name : undefined;
    if (errorName === 'TokenExpiredError') {
      return Send.unauthorized(res, null, 'Token expired');
    }
    if (errorName === 'JsonWebTokenError' || errorName === 'NotBeforeError') {
      return Send.unauthorized(res, null, 'Invalid token');
    }

    return Send.error(res, null, 'Unexpected error occurred');
  }
};

export default authMiddleware;
