import { Router, Request, Response, NextFunction } from 'express';
import { getConversation, getUserConversations, deleteConversation, sendMessage, findExistingConversation } from '../controllers/conversationController';

const router = Router();

// Middleware pentru a gestiona cererile DELETE și a valida parametrii
const deleteConversationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  console.log('DELETE middleware called for conversation:', req.params.id);
  console.log('Query parameters:', req.query);
  console.log('Body:', req.body);
  
  // Verificăm dacă userId există în query și îl adăugăm la body
  if (req.query && req.query.userId) {
    // Inițializăm req.body dacă nu există
    if (!req.body) {
      req.body = {};
    }
    
    // Adăugăm userId la body
    req.body.userId = req.query.userId;
    
    console.log('Body actualizat:', req.body);
  } else {
    console.log('ATENȚIE: userId nu a fost găsit în query parameters!');
  }
  
  next();
};

// Ruta pentru verificarea existenței unei conversații între doi utilizatori
router.get('/check-existing', findExistingConversation as any);

// Ruta pentru obținerea conversațiilor unui utilizator
router.get('/', getUserConversations as any);

// Ruta pentru obținerea unei conversații specifice
router.get('/:id', getConversation as any);

// Ruta pentru ștergerea unei conversații - cu middleware special
router.delete('/:id', deleteConversationMiddleware, deleteConversation as any);

// Ruta pentru trimiterea unui mesaj în conversație
router.post('/:id/messages', sendMessage as any);

// Aici poți adăuga alte rute pentru conversații în viitor
// router.post('/', createConversation);
// router.put('/:id', updateConversation);
// router.delete('/:id', deleteConversation);
// router.post('/:id/messages', sendMessage);

export default router; 