#!/bin/bash

# Docker deployment script for API Abuse Traffic Analytics Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Setup environment variables
setup_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.docker" ]; then
            cp .env.docker .env
            print_warning "Please edit .env file with your secure passwords and secrets before proceeding."
            print_warning "Required variables: MONGO_ROOT_PASSWORD, MONGO_PASSWORD, JWT_SECRET, API_KEY"
            read -p "Press Enter after editing .env file..."
        else
            print_error ".env.docker template not found!"
            exit 1
        fi
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting Docker services..."

    if [ "$1" = "dev" ]; then
        print_status "Starting in development mode with hot reloading..."
        docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
    else
        print_status "Starting in production mode..."
        docker-compose up -d --build
    fi
}

# Stop services
stop_services() {
    print_status "Stopping Docker services..."
    docker-compose down
}

# View logs
show_logs() {
    if [ -z "$2" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$2"
    fi
}

# Clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
}

# Show status
show_status() {
    print_status "Docker services status:"
    docker-compose ps
    echo ""
    print_status "Access URLs:"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:4000"
    echo "  MongoDB UI:   http://localhost:8081 (admin/admin)"
    echo "  Dev Frontend: http://localhost:5173 (if in dev mode)"
}

# Main script logic
case "$1" in
    "start")
        check_docker
        setup_env
        start_services "$2"
        sleep 5
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        check_docker
        stop_services
        start_services "$2"
        sleep 5
        show_status
        ;;
    "logs")
        show_logs "$@"
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "dev")
        check_docker
        setup_env
        start_services "dev"
        sleep 5
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|cleanup|dev}"
        echo ""
        echo "Commands:"
        echo "  start [dev]    - Start services (add 'dev' for development mode)"
        echo "  stop           - Stop all services"
        echo "  restart [dev]  - Restart services"
        echo "  logs [service] - Show logs (optionally for specific service)"
        echo "  status         - Show services status and access URLs"
        echo "  cleanup        - Remove containers, volumes, and clean up"
        echo "  dev            - Start in development mode with hot reloading"
        echo ""
        echo "Examples:"
        echo "  $0 start       - Start production services"
        echo "  $0 start dev   - Start development services"
        echo "  $0 logs backend - Show backend logs"
        exit 1
        ;;
esac