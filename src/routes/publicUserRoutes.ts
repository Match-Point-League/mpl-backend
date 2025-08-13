import { Router } from 'express';
import { PublicUserController } from '../controllers/publicController';

const router = Router();

/**
 * Public routes
 * Base path: /api/v1/public
 */

// GET /api/v1/public/players/:sport
// Returns all players for a specific sport
router.get('/:sport', PublicUserController.getPlayersBySport);

export default router;