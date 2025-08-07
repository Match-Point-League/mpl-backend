/**
 * Match-related types for the Match Point League system
 */

export enum MatchType {
  FRIENDLY = 'friendly',
  LEAGUE = 'league',
}

export enum Sport {
  TENNIS = 'tennis',
  PICKLEBALL = 'pickleball',
}

export enum MatchStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SCORE_REPORTED = 'score reported',
  SCORE_VERIFIED = 'score verified',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Individual set score structure
 */
export interface SetScore {
  player1: number;
  player2: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

/**
 * Complete match score structure
 */
export interface MatchScore {
  sets: SetScore[];
}

/**
 * Complete match type with score approval system
 */
export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  match_type: MatchType;
  sport: Sport;
  match_time: Date;
  court_id: string;
  status: MatchStatus;
  score?: MatchScore;
  winner_id?: string;
  created_by: string;
  score_submitter_id?: string;
  score_approver_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input type for creating a new match
 */
export interface CreateMatchInput {
  player1_id: string;
  player2_id: string;
  match_type: MatchType;
  sport: Sport;
  match_time: Date;
  court_id: string;
  created_by: string;
}

/**
 * Input type for submitting a score
 */
export interface SubmitScoreInput {
  player_id: string;
  score: MatchScore;
}

/**
 * Input type for approving a score
 */
export interface ApproveScoreInput {
  player_id: string;
}
