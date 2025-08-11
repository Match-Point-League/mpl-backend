# Match Point League Backend API

A Node.js/Express.js backend API for the Match Point League application, built with TypeScript and PostgreSQL.

#### Health Check
- **Method:** `GET`
- **Path:** `/api/v1/health`
- **Description:** Comprehensive system health check including database connectivity

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run migrations: `npm run migrate:up`
5. Start development server: `npm run dev`

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate:create` - Create a new database migration
- `npm run migrate:up` - Run database migrations
- `npm run migrate:down` - Rollback migrations
- `npm run migrate:status` - Check migration status

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=8080
NODE_ENV=development
API_VERSION=v1
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=match_point_league
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
