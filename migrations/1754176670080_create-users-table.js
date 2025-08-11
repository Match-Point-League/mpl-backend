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
  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    display_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    skill_level: {
      type: 'decimal(2,1)',
      notNull: true,
      check: 'skill_level >= 1.0 AND skill_level <= 5.5',
    },
    preferred_sport: {
      type: 'varchar(20)',
      notNull: true,
      check: "preferred_sport IN ('tennis', 'pickleball', 'both')",
    },
    is_competitive: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    city: {
      type: 'varchar(100)',
      notNull: true,
    },
    zip_code: {
      type: 'varchar(10)',
      notNull: true,
    },
    allow_direct_contact: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'player',
      check: "role IN ('player', 'admin', 'superadmin')",
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'preferred_sport');
  pgm.createIndex('users', 'role');
  // Create updated_at trigger function
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
  pgm.createTrigger('users', 'set_timestamp', {
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
  pgm.dropTrigger('users', 'set_timestamp');
  pgm.dropFunction('trigger_set_timestamp');
  pgm.dropTable('users');
};
