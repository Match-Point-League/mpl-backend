import { Router } from 'express';
import { HealthController } from '../controllers';

const router = Router();

/**
 * Health check routes
 * Base path: /api/v1/health
 */

// GET /api/v1/health
router.get('/', HealthController.getHealthCheck);

// GET /api/v1/ping
router.get('/ping', HealthController.ping);

export default router;