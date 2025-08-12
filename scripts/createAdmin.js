#!/usr/bin/env node

/**
 * Role Update Script for Match Point League
 * 
 * This script allows authorized personnel to update existing users' roles.
 * It changes the role of an existing user to admin or superadmin privileges.
 * 
 * Usage:
 *   node scripts/createAdmin.js --email user@example.com --role admin
 *   node scripts/createAdmin.js --email user@example.com --role superadmin
 * 
 * Security Note: This script should only be run by authorized personnel in secure environments.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'match_point_league',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
};

// Role validation
const VALID_ROLES = ['player', 'admin', 'superadmin'];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--') && args[i + 1]) {
      const key = args[i].substring(2);
      parsed[key] = args[i + 1];
    }
  }

  return parsed;
}

/**
 * Validate required fields
 */
function validateInput(data) {
  const errors = [];

  if (!data.email) errors.push('Email is required (--email)');
  if (!data.role) errors.push('Role is required (--role)');

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.role && !VALID_ROLES.includes(data.role)) {
    errors.push(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Update user role in database
 */
async function updateUserRole(db, email, newRole) {
  const query = `
    UPDATE users 
    SET role = $1, updated_at = NOW()
    WHERE email = $2
    RETURNING id, email, name, display_name, role, updated_at
  `;

  const result = await db.query(query, [newRole, email]);
  return result.rows[0];
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = parseArgs();
    
    // Validate input
    const validationErrors = validateInput(args);
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:');
      validationErrors.forEach(error => console.error(`  - ${error}`));
      console.error('\nUsage: node scripts/createAdmin.js --email user@example.com --role admin');
      process.exit(1);
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    const db = new Pool(dbConfig);
    
    // Test connection
    await db.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Check if user exists
    const existingUser = await db.query('SELECT id, email, name, display_name, role FROM users WHERE email = $1', [args.email]);
    if (existingUser.rows.length === 0) {
      console.error('❌ User not found:');
      console.error(`  Email: ${args.email}`);
      console.error('\nMake sure the user exists in the database before updating their role.');
      await db.end();
      process.exit(1);
    }

    const user = existingUser.rows[0];
    console.log('👤 Found user:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Current Role: ${user.role}`);

    // Check if role is already set to the requested value
    if (user.role === args.role) {
      console.log(`⚠️  User already has role: ${args.role}`);
      console.log('No changes needed.');
      await db.end();
      process.exit(0);
    }

    // Update user role
    console.log(`🔄 Updating user role from '${user.role}' to '${args.role}'...`);
    const updatedUser = await updateUserRole(db, args.email, args.role);
    
    console.log('✅ User role updated successfully!');
    console.log('\nUpdated User Details:');
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Display Name: ${updatedUser.display_name}`);
    console.log(`  New Role: ${updatedUser.role}`);
    console.log(`  Updated: ${updatedUser.updated_at}`);
    
    console.log('\n🔐 The user now has elevated privileges.');
    console.log('⚠️  Make sure to inform the user about their new role and responsibilities.');

    // Close database connection
    await db.end();

  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure your PostgreSQL server is running and accessible.');
    } else if (error.code === '28P01') {
      console.error('💡 Check your database credentials in the .env file.');
    }
    
    process.exit(1);
  }
}

// Run the script
main();
