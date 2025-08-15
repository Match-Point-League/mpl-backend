import { Router } from 'express';
import { CourtsController } from '../controllers';

const router = Router();

/**
 * Public Court routes
 * Base path: /api/v1/public/courts
 * No authentication required
 */

// GET /api/v1/public/courts/verified - Get all verified courts
router.get('/verified', CourtsController.getOnlyVerifiedCourts);

// GET /api/v1/public/courts/:id - Get verified court by ID
router.get('/:id', CourtsController.getVerifiedCourt);

export default router;
