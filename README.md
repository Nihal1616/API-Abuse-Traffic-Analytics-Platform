# API Abuse Traffic Analytics Platform

A comprehensive security monitoring platform for detecting and preventing API abuse through real-time traffic analysis, threat intelligence, and automated response systems.

## 🚀 Features

- **Real-time Traffic Monitoring**: Live API request tracking and analysis
- **Rate Limiting**: Configurable rate limits with Redis support
- **Threat Detection**: Automated anomaly and threat actor identification
- **Interactive Dashboard**: Modern React UI with real-time updates
- **Security Analytics**: Comprehensive metrics and reporting
- **WebSocket Integration**: Live data streaming
- **MongoDB Storage**: Scalable data persistence
- **Docker Support**: Easy deployment with containerization

## 🏗️ Architecture

### Backend (Node.js/Express)

- RESTful API with security middleware
- MongoDB for data storage
- Socket.IO for real-time updates
- JWT authentication
- Rate limiting and abuse detection

### Frontend (React/TypeScript)

- Modern dashboard with Tailwind CSS
- Real-time charts and metrics
- Threat actor monitoring
- Responsive design

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Redis (optional, for distributed rate limiting)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd API-Abuse-Traffic-Analytics-Platform
```

### 2. Backend Setup

If running locally:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run seed  # Optional: seed with sample data
npm start
```

For deployment on Render:

- Connect your GitHub repo to Render
- Set environment variables in Render dashboard
- Deploy the backend service

### 3. Frontend Setup

```bash
cd ../frontend
cp .env.example .env
# Edit .env with your API URLs (use Render URL if backend is deployed)
npm install
npm run dev
```

### Client reCAPTCHA guidance

- Set `RECAPTCHA_SECRET` in backend environment for server verification.
- On the frontend, load reCAPTCHA (v3 or v2) and store the resulting token as `window.__recaptchaToken` or in `localStorage` under `recaptcha_token`.
- The frontend `api` client automatically attaches the token as the `x-recaptcha-token` header for all `POST /api` requests.

Example (v3) flow:

1. Load reCAPTCHA and execute: `grecaptcha.execute(siteKey, {action: 'submit'})`.
2. Store token in client: `window.__recaptchaToken = token; localStorage.setItem('recaptcha_token', token);`.
3. Send POST request as usual — the token will be attached automatically by the client.

If you need to exempt routes from reCAPTCHA (for testing), set `RECAPTCHA_EXEMPT_ROUTES` in backend `.env` as a comma-separated list of regex patterns (e.g. `^/api/metrics, ^/api/health`).

### 4. Access the Application

- Frontend: http://localhost:5173 (local) or your deployed frontend URL
- Backend API: http://localhost:4000 (local) or your Render backend URL

## ⚙️ Environment Variables

### Backend (.env)

```env
# Required
MONGODB_URI=mongodb://localhost:27017/api-shield  # Use MongoDB Atlas for production
JWT_SECRET=your-super-secret-jwt-key
API_KEY=your-api-key

# Optional
REDIS_URL=redis://localhost:6379  # Use Redis Cloud or similar for production
PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:4000/api  # Use your Render backend URL for production
VITE_SOCKET_URL=http://localhost:4000   # Use your Render backend URL for production
```

### Production Deployment Notes

- For Render deployment, set environment variables in the Render dashboard
- Use MongoDB Atlas for database in production
- **Whitelist Render outbound IPs in MongoDB Atlas**: Add these IP ranges to your MongoDB Atlas network access:
  - 74.220.48.0/24
  - 74.220.56.0/24
- Update CORS origins in `backend/app.js` to allow your frontend domain (e.g., your Render frontend URL)
- Ensure JWT_SECRET and API_KEY are secure random strings
- If deploying frontend on Render, update VITE_API_URL and VITE_SOCKET_URL accordingly

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Setup environment variables:**

   ```bash
   cp .env.docker .env
   # Edit .env with your secure passwords and secrets
   ```

2. **Start all services:**

   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - MongoDB Express: http://localhost:8081

### Development with Docker

For development with hot reloading:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

This will start:

- Frontend: http://localhost:5173 (with hot reloading)
- Backend: http://localhost:4000 (with nodemon)
- MongoDB: localhost:27017
- Redis: localhost:6379

### Production Deployment

For production deployment with Nginx reverse proxy:

```bash
docker-compose --profile production up -d
```

### Docker Services

- **mongodb**: MongoDB database with authentication
- **redis**: Redis for caching and rate limiting
- **backend**: Node.js API server
- **frontend**: React application served by Nginx
- **nginx**: Reverse proxy (production only)
- **mongo-express**: MongoDB web UI

### Environment Variables for Docker

Required variables in `.env`:

```env
MONGO_ROOT_PASSWORD=your_secure_root_password
MONGO_PASSWORD=your_secure_app_password
MONGO_EXPRESS_PASSWORD=your_secure_express_password
JWT_SECRET=your-super-secret-jwt-key
API_KEY=your-api-key-for-admin-access
```

### Docker Management Commands

```bash
# Start services
docker-compose up -d

# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Clean up (removes volumes too)
docker-compose down -v
```

### Core Metrics

- `GET /api/metrics/dashboard` - Dashboard overview
- `GET /api/metrics/security/blocked` - Blocked requests
- `GET /api/security/traffic` - Traffic analysis

### Security Actions

- `POST /api/security/actions/block` - Block IP addresses
- `GET /api/security/threat-actors` - Threat actor list

## 🔒 Security Features

- **Rate Limiting**: 100 requests per minute (configurable)
- **JWT Authentication**: Secure API access
- **Security Headers**: Helmet.js protection
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configured origins
- **Request Tracking**: Comprehensive logging

## 🧪 Testing Rate Limiting

1. Start the backend server
2. Use Postman or curl to send rapid requests:
   ```bash
   for i in {1..105}; do curl http://localhost:4000/api/metrics/dashboard; done
   ```
3. First 100 requests succeed, 101+ return 429 status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Set up your environment variables
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 📝 Project Structure

```
API-Abuse-Traffic-Analytics-Platform/
├── backend/
│   ├── controllers/     # API route handlers
│   ├── middleware/      # Express middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API integration
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
└── docs/               # Documentation
```

## 📄 License

MIT License - see individual README files for details

## 🆘 Support

- Check the README files in backend/ and frontend/ directories
- Review environment variable configuration
- Ensure MongoDB is running and accessible
- Check console logs for error messages
