import { Router } from 'express';
import userRoutes from './user.routes';

const router = Router();

// Ruta de bază pentru a verifica dacă API-ul funcționează
router.get('/', (req, res) => {
  res.json({ message: 'API funcționează!' });
});

// Înregistrarea rutelor specifice
router.use('/users', userRoutes);
// Adaugă aici alte rute specifice modulelor tale

export default router; 