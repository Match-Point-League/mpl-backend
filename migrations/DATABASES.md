### Database Information

## Users table

- `id` (UUID, primary key)
- `email` (varchar(255), unique, not null)
- `name` (varchar(100), not null)
- `display_name` (varchar(100), not null)
- `skill_level` (decimal(2,1), 1.0-5.5, not null)
- `preferred_sport` (varchar(20), enum: 'tennis', 'pickleball', 'both', not null)
- `is_competitive` (boolean, not null, default: false)
- `city` (varchar(100), not null)
- `zip_code` (varchar(10), not null)
- `allow_direct_contact` (boolean, not null, default: false)
- `created_at` (timestamp with time zone, not null, default: now())
- `updated_at` (timestamp with time zone, not null, default: now())

## Matches table

- `id` (UUID, primary key)
- `player1_id` (UUID, foreign key to users.id, not null)
- `player2_id` (UUID, foreign key to users.id, not null)
- `match_type` (varchar(20), enum: 'friendly', 'league', not null)
- `sport` (varchar(20), enum: 'tennis', 'pickleball', not null)
- `match_time` (timestamp with time zone, not null)
- `court_id` (UUID, foreign key to courts.id, not null)
- `status` (varchar(20), enum: 'pending', 'confirmed', 'score reported', 'score verified', 'completed', 'cancelled', not null, default: 'pending')
- `score` (jsonb, nullable)  
  - Example format:  
    ```json
    {
      "sets": [
        { "player1": 6, "player2": 4 },
        { "player1": 3, "player2": 6 },
        { 
          "player1": 7, 
          "player2": 6, 
          "tiebreak": { "player1": 10, "player2": 8 }
        }
      ]
    }
    ```
  - Each set object contains `player1` and `player2` scores (integers).  
  - If a tiebreak was played in a set, include a `tiebreak` object with `player1` and `player2` scores.
- `winner_id` (UUID, foreign key to users.id, nullable)
- `created_by` (UUID, foreign key to users.id, not null)
- `score_submitter_id` (UUID, foreign key to users.id, nullable)
- `score_verified` (boolean, not null, default: false)
- `created_at` (timestamp with time zone, not null, default: now())
- `updated_at` (timestamp with time zone, not null, default: now())


## Courts table

- `id` (UUID, primary key)
- `name` (varchar(255), not null)
- `address_line` (varchar(255), not null)
- `city` (varchar(100), not null)
- `state` (varchar(50), not null)
- `zip_code` (varchar(10), not null)
- `is_indoor` (boolean, not null)  
  - `true` = indoor, `false` = outdoor
- `lights` (boolean, nullable)  
  - Only applies to outdoor courts; `null` if indoor
- `sport` (varchar(20), enum: 'tennis', 'pickleball', 'both', not null)
- `verified` (boolean, not null, default: false)
- `created_by` (UUID, foreign key to users.id, not null)
- `created_at` (timestamp with time zone, not null, default: now())
- `updated_at` (timestamp with time zone, not null, default: now())
