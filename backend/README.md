# API Abuse Traffic Analytics Platform - Backend

A Node.js backend service for monitoring and analyzing API traffic patterns to detect and prevent abuse.

## Features

- Real-time API traffic monitoring
- Rate limiting and abuse detection
- Threat intelligence integration
- MongoDB data storage
- WebSocket real-time updates
- Comprehensive security middleware

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Redis (optional, for distributed rate limiting)

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:

   ### Required Variables
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/api-shield

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   API_KEY=your-api-key-for-admin-access

   # Server
   PORT=4000
   NODE_ENV=development
   ```

   ### Optional Variables
   ```env
   # Redis for distributed rate limiting
   REDIS_URL=redis://localhost:6379

   # MongoDB Authentication (for production)
   MONGO_ROOT_PASSWORD=your_root_password
   MONGO_PASSWORD=your_app_password

   # Logging
   LOG_LEVEL=info
   ```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Database Seeding
```bash
npm run seed
```

## API Endpoints

- `GET /api/metrics/dashboard` - Dashboard metrics
- `GET /api/metrics/security/blocked` - Blocked requests data
- `GET /api/security/traffic` - Traffic analysis
- `POST /api/security/actions/block` - Block IP addresses

## Docker Support

The backend includes Docker support with MongoDB:

```bash
docker-compose up -d
```

## Security Features

- Rate limiting (configurable per endpoint)
- JWT authentication
- Security headers (Helmet.js)
- Input validation
- CORS protection
- Request tracking and logging

## Project Structure

```
backend/
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/         # MongoDB schemas
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utilities
└── scripts/        # Database scripts
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License