import { Router } from 'express';
import userRoutes from './user.routes';

const router = Router();

// Ruta de bază pentru a verifica dacă API-ul funcționează
router.get('/', (req, res) => {
  res.json({ message: 'API funcționează!' });
});

// Endpoint pentru healthcheck Docker
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Înregistrarea rutelor specifice
router.use('/users', userRoutes);
// Adaugă aici alte rute specifice modulelor tale

export default router; 