import { Router } from 'express';
import healthRoutes from './healthRoutes';
import usersRoutes from './usersRoutes';
import authRoutes from './authRoutes';
import publicUserRoutes from './publicUserRoutes';
import courtsRoutes from './courtsRoutes';

const router = Router();

/**
 * API Routes
 * Base path: /api/v1
 */

// Health and monitoring routes
router.use('/health', healthRoutes);
router.use('/ping', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Users routes
router.use('/users', usersRoutes);

// Public routes
// Players routes
router.use('/public/players', publicUserRoutes);

// Courts routes
router.use('/courts', courtsRoutes);

export default router;