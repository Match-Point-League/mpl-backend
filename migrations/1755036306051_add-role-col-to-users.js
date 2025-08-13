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
  // Add role column to users table
  pgm.addColumn('users', {
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'player',
      check: "role IN ('player', 'admin', 'superadmin')",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Remove role column from users table
  pgm.dropColumn('users', 'role');
};
