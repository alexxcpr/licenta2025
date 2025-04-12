import { Request, Response, NextFunction } from 'express';

// Interfață pentru erorile extinse
interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

/**
 * Middleware pentru gestionarea erorilor în aplicație
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Setare valori implicite
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Detalii diferite despre eroare în funcție de mediul de rulare
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // În producție, nu trimite stiva de erori
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Ceva nu a funcționat corect!'
    });
  }
}; 