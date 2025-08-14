import { Router } from 'express';
import { MatchesController } from '../controllers/matchesController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Matches routes
 * Base path: /api/v1/matches
 */

// POST /api/v1/matches
// Create a new match (requires authentication)
router.post('/', authenticateToken, MatchesController.createMatch);

export default router;