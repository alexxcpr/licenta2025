import { Request, Response, NextFunction } from 'express';

/**
 * Utilitar pentru gestionarea erorilor în funcțiile asincrone
 * Elimină necesitatea de a folosi try/catch în fiecare controller
 */
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync; 