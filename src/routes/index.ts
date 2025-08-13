import { Router } from 'express';
import healthRoutes from './healthRoutes';
import usersRoutes from './usersRoutes';
import authRoutes from './authRoutes';
import matchesRoutes from './matchesRoutes';

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

// Matches routes
router.use('/matches', matchesRoutes);

export default router;