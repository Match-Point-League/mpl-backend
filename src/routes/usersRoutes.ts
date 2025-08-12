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

// GET /api/v1/users/get-user-by-email
router.get('/get-user-by-email', UsersController.getUserByEmail);

// PUT /api/v1/users/update-user
router.put('/update-user', UsersController.updateUser);

export default router;