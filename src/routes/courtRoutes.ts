import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken, requireAdminRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * Authenticated Court routes
 * Base path: /api/v1/courts
 * Authentication required
 */

// POST /api/v1/courts - Create new court
// Authenticated endpoint
router.post('/', authenticateToken, CourtsController.createCourt);

// PUT /api/v1/courts/update-court/:id - Update existing court
// Admin only endpoint
router.put('/update-court/:id', authenticateToken, requireAdminRole, CourtsController.updateCourt);

export default router;
