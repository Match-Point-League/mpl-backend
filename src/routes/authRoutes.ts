import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/v1/auth
 */

// Sign up endpoint
router.post('/signup', AuthController.signUp);

// Sign in endpoint
router.post('/signin', AuthController.signIn);

// Verify token endpoint
router.get('/verify', AuthController.verifyToken);

// Validate registration data endpoint
router.post('/validate-registration', AuthController.validateRegistration);

// Validate ZIP code endpoint
router.post('/validate-zipcode', AuthController.validateZipCode);

export default router; 