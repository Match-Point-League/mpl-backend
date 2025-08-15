import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken, requireAdminRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * Admin Court routes
 * Base path: /api/v1/admin/courts
 * Authentication and admin role required
 */
router.use(authenticateToken);
router.use(requireAdminRole);

// PUT /api/v1/admin/courts/update-court/:id - Update existing court
router.put('/update-court/:id', CourtsController.updateCourt);

// GET /api/v1/admin/courts/verified?verified=true - Get courts by verification status
// Example: /api/v1/admin/courts/verified?verified=true or /api/v1/admin/courts/verified?verified=false
router.get('/verified', CourtsController.getCourtsByVerified);

// GET /api/v1/admin/courts/all - Get all courts
router.get('/all', CourtsController.getAllCourts);

// GET /api/v1/admin/courts/court?id=123 - Get court by ID
// Example: /api/v1/admin/courts/court?id=123-abc
router.get('/court', CourtsController.getCourtById);

export default router;
