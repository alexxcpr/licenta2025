import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes';
import { errorHandler } from '../middleware/error.middleware';

// Configurarea aplicației Express
export const configureApp = (): Application => {
  const app: Application = express();
  
  // Middleware-uri de bază
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Ruta de bază
  app.get('/', (req, res) => {
    res.json({ message: 'Ruta de baza a fost apelata' });
  });
  
  // Înregistrarea rutelor
  app.use('/api', routes);
  
  // Middleware pentru tratarea erorilor
  app.use(errorHandler);
  
  return app;
}; 