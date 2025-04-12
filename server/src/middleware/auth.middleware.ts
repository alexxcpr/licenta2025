import { Request, Response, NextFunction } from 'express';

// Extindere a tipului Request pentru a adăuga informații despre utilizator
declare global {
  namespace Express {
    interface Request {
      user?: any;  // Sau o interfață specifică de utilizator
    }
  }
}

/**
 * Middleware pentru protejarea rutelor care necesită autentificare
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Aici implementează logica de autentificare
    // De exemplu, verificarea unui token JWT
    
    // Exemplu simplu (înlocuiește cu logica reală de autentificare)
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Nu ești autentificat. Te rugăm să te autentifici pentru a accesa această resursă.'
      });
    }
    
    // Exemplu: Decodifică token-ul și verifică-l
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Token invalid sau expirat.'
    });
  }
}; 