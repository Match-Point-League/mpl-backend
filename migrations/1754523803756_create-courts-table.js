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
  pgm.createTable('courts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    address_line: {
      type: 'varchar(255)',
      notNull: true
    },
    city: {
      type: 'varchar(100)',
      notNull: true
    },
    state: {
      type: 'varchar(50)',
      notNull: true
    },
    zip_code: {
      type: 'varchar(10)',
      notNull: true
    },
    is_indoor: {
      type: 'boolean',
      notNull: true
    },
    lights: {
      type: 'boolean',
      notNull: false
    },
    sport: {
      type: 'varchar(20)',
      notNull: true,
      check: "sport IN ('tennis', 'pickleball', 'both')"
    },
    verified: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
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
  pgm.createIndex('courts', ['city']);
  pgm.createIndex('courts', ['state']);
  pgm.createIndex('courts', ['zip_code']);
  pgm.createIndex('courts', ['sport']);
  pgm.createIndex('courts', ['verified']);
  pgm.createIndex('courts', ['is_indoor']);
  pgm.createIndex('courts', ['created_by']);
  
  // Composite indexes for common location-based queries
  pgm.createIndex('courts', ['city', 'sport']);
  pgm.createIndex('courts', ['zip_code', 'sport']);
  pgm.createIndex('courts', ['state', 'city']);
  pgm.createIndex('courts', ['sport', 'verified']);

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
  pgm.createTrigger('courts', 'set_timestamp', {
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
  pgm.dropTrigger('courts', 'set_timestamp');
  pgm.dropFunction('trigger_set_timestamp');
  pgm.dropTable('courts');
}; 