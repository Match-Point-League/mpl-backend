import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Court routes
 * Base path: /api/v1/courts
 */

// POST /api/v1/courts - Create new court
// Authenticated endpoint
router.post('/', authenticateToken, CourtsController.createCourt);

export default router;
