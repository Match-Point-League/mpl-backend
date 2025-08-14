import { Router } from 'express';
import { CourtsController } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Authenticated Court routes
 * Base path: /api/v1/courts
 * Authentication required
 */

// POST /api/v1/courts - Create new court
// Authenticated endpoint
router.post('/', authenticateToken, CourtsController.createCourt);

// GET /api/v1/courts/verified?verified=true - Get courts by verification status
// Example: /api/v1/courts/verified?verified=true or /api/v1/courts/verified?verified=false
router.get('/verified', CourtsController.getCourtsByVerified);

// GET /api/v1/courts/court?id=123 - Get court by ID
// Example: /api/v1/courts/court?id=123-abc
router.get('/court', CourtsController.getCourtById);

export default router;
