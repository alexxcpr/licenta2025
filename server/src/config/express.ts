import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes';
import { errorHandler } from '../middleware/error.middleware';

// Configurarea aplicației Express
export const configureApp = (): Application => {
  const app: Application = express();
  
  // Configurare CORS cu opțiuni explicite
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8081', 'exp://'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true
  }));

  // Middleware-uri de bază
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logging middleware pentru debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
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