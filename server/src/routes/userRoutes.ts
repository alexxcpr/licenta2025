import { Router } from 'express';
import { getUserProfile, getAllUsers } from '../controllers/userController';

const router = Router();

// Ruta pentru obținerea listei de utilizatori - pentru testare
router.get('/', getAllUsers as any);

// Ruta pentru obținerea profilului unui utilizator
router.get('/profile/:id', getUserProfile as any);

// Aici poți adăuga alte rute pentru utilizatori în viitor
// router.put('/:id', updateUser);
// router.delete('/:id', deleteUser);

export default router; 