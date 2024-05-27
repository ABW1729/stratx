import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include userId and userRole
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Middleware to authenticate JWT tokens
const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Extract the token from the Authorization header
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Token Required' });
  }

  try {
    // Verify the token and extract the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number; userRole: string };
    // Attach the userId and userRole to the request object
    req.userId = decoded.userId;
    req.userRole = decoded.userRole;
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid Token' });
  }
};

// Middleware to authorize based on user roles
const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.userRole || '')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Proceed to the next middleware or route handler
    next();
  };
};

export { authenticateJWT, authorizeRole };