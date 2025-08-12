import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Court routes
 * Base path: /api/v1/courts
 */

// POST /api/v1/courts - Create new court
// Requires authentication-- must be created by a user
router.post('/', authenticateToken, CourtsController.createCourt);

export default router;
