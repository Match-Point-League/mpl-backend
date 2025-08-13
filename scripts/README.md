# Role Update Scripts

This directory contains scripts for administrative tasks in the Match Point League backend.

## createAdmin.js

A secure script for updating existing users' roles to elevated privileges. This script changes the role of an existing user to admin or superadmin.

### Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and accessible
2. **Environment Variables**: Make sure your `.env` file contains the necessary database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=match_point_league
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```
3. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

### Usage

#### Using npm script (recommended):
```bash
npm run update-role -- --email user@example.com --role admin
```

#### Direct execution:
```bash
node scripts/changeRoleScript.js --email user@example.com --role admin
```

### Parameters

- `--email`: Email address of the existing user (required)
- `--role`: New role to assign - must be one of: `player`, `admin`, `superadmin` (required)

### Examples

#### Update a user to admin role:
```bash
npm run update-role -- --email john@matchpointleague.com --role admin
```

#### Update a user to superadmin role:
```bash
npm run update-role -- --email sarah@matchpointleague.com --role superadmin
```

#### Downgrade a user to player role:
```bash
npm run update-role -- --email admin@matchpointleague.com --role player
```

### Security Features

- **Input Validation**: All inputs are validated for format and security
- **User Existence Check**: Verifies the user exists before attempting to update
- **Role Validation**: Ensures only valid roles are accepted
- **Change Detection**: Prevents unnecessary updates if role is already set

### Output

The script provides detailed feedback:
- ✅ Success confirmation with updated user details
- ⚠️ Warnings if no changes are needed
- ❌ Clear error messages for validation failures
- 💡 Helpful suggestions for common issues

### Important Notes

1. **Security**: This script should only be run by authorized personnel
2. **User Existence**: The user must already exist in the database
3. **Role Changes**: Users will immediately have access to their new role level
4. **Role Hierarchy**: 
   - `player`: Regular user access
   - `admin`: Administrative access (includes player access)
   - `superadmin`: Highest level access (includes admin access)

### Troubleshooting

#### Common Issues:

1. **Connection Refused**: Ensure PostgreSQL server is running
2. **Authentication Failed**: Check database credentials in `.env` file
3. **Validation Errors**: Review input parameters and ensure all required fields are provided
4. **User Not Found**: Make sure the user exists in the database before updating their role

#### Getting Help:

If you encounter issues, check:
- Database connection status
- Environment variable configuration
- Input parameter format
- Database migration status
- User existence in the database
