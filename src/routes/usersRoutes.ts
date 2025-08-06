import { Router } from 'express';
import { UsersController } from '../controllers';

const router = Router();

/**
 * Health check routes
 * Base path: /api/v1/health
 */

// GET /api/v1/users/get-user-by-email?email=user@example.com
// Email passed as a query parameter
router.get('/get-user-by-email', UsersController.getUserByEmail);

export default router;