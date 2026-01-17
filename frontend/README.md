# API Abuse Traffic Analytics Platform - Frontend

A modern React dashboard for visualizing API traffic patterns, security metrics, and threat intelligence.

## Features

- Real-time dashboard with live metrics
- Interactive traffic charts and graphs
- Threat actor monitoring
- Anomaly detection visualization
- Responsive design with Tailwind CSS
- WebSocket real-time updates

## Prerequisites

- Node.js (v16 or higher)
- Backend API server running

## Installation

1. Clone the repository
2. Navigate to the frontend directory
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

   ### Development (Default)
   ```env
   VITE_API_URL=http://localhost:4000/api
   VITE_SOCKET_URL=http://localhost:4000
   ```

   ### Production
   ```env
   VITE_API_URL=https://your-api-domain.com/api
   VITE_SOCKET_URL=https://your-api-domain.com
   ```

## Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Socket.IO** - Real-time communication
- **Recharts** - Data visualization

## Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   │   ├── dashboard/  # Dashboard-specific components
│   │   └── ui/         # Generic UI components
│   ├── pages/       # Page components
│   ├── services/    # API and WebSocket services
│   ├── types/       # TypeScript type definitions
│   ├── hooks/       # Custom React hooks
│   └── lib/         # Utilities and configurations
└── types/           # Shared type definitions
```

## Key Components

- **Dashboard**: Main metrics overview
- **TrafficChart**: Real-time traffic visualization
- **ThreatActorsList**: IP threat monitoring
- **AnomalyTimeline**: Security event timeline
- **MetricCard**: Reusable metric display

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Environment Setup for Team Development

1. Each developer should copy `.env.example` to `.env`
2. Configure personal API endpoints if needed
3. Never commit `.env` files (already in .gitignore)
4. Use different ports if running multiple instances

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Test components thoroughly
4. Follow React best practices

## License

MIT License
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
