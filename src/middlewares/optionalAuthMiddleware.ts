import { Request, Response, NextFunction } from 'express';
import TokenService from '../service/TokenService';

const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.userId = '';

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const tokenData = TokenService.verifyAccessToken(token);
    if (tokenData && typeof tokenData.userId === 'string') {
      req.userId = tokenData.userId;
    }

    return next();
  } catch {
    // Ignore token errors for optional auth.
    return next();
  }
};

export default optionalAuthMiddleware;
