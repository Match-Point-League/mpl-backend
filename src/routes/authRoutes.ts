import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

/**
 * Authentication routes
 * Base path: /api/v1/auth
 */

// POST /api/v1/auth/signup
// Handles user registration (sign-up)
router.post('/signup', AuthController.signUp);

export default router; 