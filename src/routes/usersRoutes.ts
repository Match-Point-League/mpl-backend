import { Router } from 'express';
import { UsersController } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Users routes
 * Base path: /api/v1/users
 * All routes require authentication
 */

// Apply authentication middleware to all users routes
router.use(authenticateToken);

// GET /api/v1/users/get-user-by-email?email=user@example.com
// Email passed as a query parameter
router.get('/get-user-by-email', UsersController.getUserByEmail);

export default router;