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
  // Add is_deleted column to users table
  pgm.addColumn('users', {
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Create index for better query performance on is_deleted column
  pgm.createIndex('users', 'is_deleted');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop the index first
  pgm.dropIndex('users', 'is_deleted');
  
  // Remove the is_deleted column from users table
  pgm.dropColumn('users', 'is_deleted');
};
