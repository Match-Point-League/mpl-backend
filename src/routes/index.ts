import { Router } from 'express';
import healthRoutes from './healthRoutes';
import usersRoutes from './usersRoutes';
import authRoutes from './authRoutes';
import publicUserRoutes from './publicUserRoutes';
import publicCourtsRoutes from './publicCourtRoutes';
import courtRoutes from './courtRoutes';

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

// Courts routes (authenticated)
router.use('/courts', courtRoutes);

// Public routes
// Players routes
router.use('/public/players', publicUserRoutes);

// Courts routes
router.use('/public/courts', publicCourtsRoutes);

export default router;