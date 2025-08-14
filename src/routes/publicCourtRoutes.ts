import { Router } from 'express';
import { CourtsController } from '../controllers';

const router = Router();

/**
 * Public Court routes
 * Base path: /api/v1/public/courts
 * No authentication required
 */

// GET /api/v1/public/courts/verified?verified=true - Get courts by verification status
// Example: /api/v1/public/courts/verified?verified=true or /api/v1/public/courts/verified?verified=false
router.get('/verified', CourtsController.getCourtsByVerified);

// GET /api/v1/public/courts/court?id=123 - Get court by ID
// Example: /api/v1/public/courts/court?id=123-abc
router.get('/court', CourtsController.getCourtById);

export default router;
