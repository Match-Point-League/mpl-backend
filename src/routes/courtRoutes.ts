import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken, requireAdminRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * Authenticated Court routes
 * Base path: /api/v1/courts
 * Authentication required
 */
router.use(authenticateToken);

// POST /api/v1/courts - Create new court
router.post('/', CourtsController.createCourt);

// PUT /api/v1/courts/update-court/:id - Update existing court
// Admin only endpoint
router.put('/update-court/:id', requireAdminRole, CourtsController.updateCourt);

// GET /api/v1/courts/verified?verified=true - Get courts by verification status (Admin only)
// Example: /api/v1/courts/verified?verified=true or /api/v1/courts/verified?verified=false
router.get('/verified', requireAdminRole, CourtsController.getCourtsByVerified);

// GET /api/v1/courts/court?id=123 - Get court by ID (Admin only)
// Example: /api/v1/courts/court?id=123-abc
router.get('/court', requireAdminRole, CourtsController.getCourtById);

export default router;
