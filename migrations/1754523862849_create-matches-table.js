/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('matches', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    player1_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    player2_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    match_type: {
      type: 'varchar(20)',
      notNull: true,
      check: "match_type IN ('friendly', 'league')"
    },
    sport: {
      type: 'varchar(20)',
      notNull: true,
      check: "sport IN ('tennis', 'pickleball')"
    },
    match_time: {
      type: 'timestamp with time zone',
      notNull: false
    },
    court_id: {
      type: 'uuid',
      notNull: true,
      references: 'courts(id)',
      onDelete: 'RESTRICT'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'confirmed', 'score reported', 'score verified', 'completed', 'cancelled')"
    },
    score: {
      type: 'jsonb',
      notNull: false
    },
    winner_id: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    score_submitter_id: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
    score_approver_id: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Create indexes for better query performance
  pgm.createIndex('matches', ['player1_id']);
  pgm.createIndex('matches', ['player2_id']);
  pgm.createIndex('matches', ['status']);
  pgm.createIndex('matches', ['sport']);
  pgm.createIndex('matches', ['created_by']);
  pgm.createIndex('matches', ['winner_id']);
  
  // Composite indexes for common queries
  pgm.createIndex('matches', ['player1_id', 'status']);
  pgm.createIndex('matches', ['player2_id', 'status']);

  // Create updated_at trigger function if it doesn't exist
  pgm.createFunction(
    'trigger_set_timestamp',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  // Create trigger for updated_at
  pgm.createTrigger('matches', 'set_timestamp', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'trigger_set_timestamp',
    level: 'ROW',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTrigger('matches', 'set_timestamp');
  pgm.dropFunction('trigger_set_timestamp');
  pgm.dropTable('matches');
};
