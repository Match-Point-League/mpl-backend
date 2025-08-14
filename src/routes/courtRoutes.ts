import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Authenticated Court routes
 * Base path: /api/v1/courts
 * Authentication required
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/v1/courts - Create new court
router.post('/', CourtsController.createCourt);

export default router;
