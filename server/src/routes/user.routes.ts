import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Rute publice
router.post('/', createUser);

// Rute protejate (necesită autentificare)
// router.use(protect);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router; 