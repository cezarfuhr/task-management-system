.PHONY: help install dev build up down logs clean test

help:
	@echo "Task Management System - Commands"
	@echo ""
	@echo "  make install        - Install dependencies for backend and frontend"
	@echo "  make dev            - Start development environment with Docker Compose"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start production environment"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make clean          - Clean all containers and volumes"
	@echo "  make test           - Run all tests"
	@echo "  make migrate        - Run database migrations"
	@echo ""

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up

build:
	@echo "Building Docker images..."
	docker-compose build

up:
	@echo "Starting production environment..."
	docker-compose up -d

down:
	@echo "Stopping all services..."
	docker-compose down

logs:
	@echo "Viewing logs..."
	docker-compose logs -f

clean:
	@echo "Cleaning containers and volumes..."
	docker-compose down -v
	@echo "Removing node_modules..."
	rm -rf backend/node_modules frontend/node_modules

test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm run test:ci

migrate:
	@echo "Running database migrations..."
	docker-compose exec backend npx prisma migrate deploy
	docker-compose exec backend npx prisma generate
