import { Router } from 'express';
import healthRoutes from './healthRoutes';

const router = Router();

/**
 * API Routes
 * Base path: /api/v1
 */

// Health and monitoring routes
router.use('/health', healthRoutes);
router.use('/ping', healthRoutes);

// Future route groups will be added here:
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/matches', matchRoutes);
// router.use('/courts', courtRoutes);

export default router;