# HelpHive Backend Server

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Environment Variables

The server uses the following environment variables (already configured in `.env`):

- `PORT=3001` - Server port
- `NODE_ENV=development` - Environment
- `DATABASE_PATH=../database/helphive.db` - SQLite database path
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN=24h` - Token expiration time
- `FRONTEND_URL=http://localhost:3000` - CORS allowed origin

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update profile (requires auth)
- `PUT /api/auth/location` - Update location (requires auth)

### Help Requests
- `GET /api/requests` - Get all requests (requires auth)
- `GET /api/requests/:id` - Get specific request (requires auth)
- `POST /api/requests` - Create new request (requires auth)
- `PUT /api/requests/:id/accept` - Accept request (volunteers only)
- `PUT /api/requests/:id/complete` - Complete request (requires auth)
- `DELETE /api/requests/:id` - Delete request (creator only)

### User
- `GET /api/users/my-requests` - Get user's created requests
- `GET /api/users/my-responses` - Get volunteer's accepted requests

## Database

The SQLite database will be automatically created at `database/helphive.db` when you first start the server.

### Schema

**Users Table:**
- id, email, password_hash, full_name, phone, role, is_verified, latitude, longitude, created_at, updated_at

**Help Requests Table:**
- id, user_id, title, description, help_type, urgency_level, location_name, latitude, longitude, status, volunteer_id, created_at, expires_at, completed_at

**Request Responses Table:**
- id, request_id, volunteer_id, message, created_at

## Development

### Watch Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create Help Request
```bash
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Need Medical Help",
    "description": "Emergency medical assistance needed",
    "help_type": "medical",
    "urgency_level": "high",
    "location_name": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change the `PORT` in `.env` file.

### Database Locked
If you get a database locked error, make sure only one instance of the server is running.

### CORS Errors
Make sure the frontend is running on `http://localhost:3000` or update `FRONTEND_URL` in `.env`.
