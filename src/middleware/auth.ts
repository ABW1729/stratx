import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Token Required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number; userRole: string };
    req.userId = decoded.userId;
    req.userRole = decoded.userRole;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid Token' });
  }
};

const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.userRole || '')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

export { authenticateJWT, authorizeRole };