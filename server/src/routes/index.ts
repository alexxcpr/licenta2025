import { Router } from 'express';
import userRoutes from './userRoutes';
import conversationRoutes from './conversationRoutes';

const router = Router();

// Ruta de bază pentru a verifica dacă API-ul funcționează
router.get('/', (req, res) => {
  res.json({ message: 'API funcționează!' });
});

// Înregistrarea rutelor specifice
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);

// Adaugă aici alte rute specifice modulelor tale

export default router; 