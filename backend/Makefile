.PHONY: help dev up down restart logs clean install test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install Go dependencies
	go mod download
	go mod tidy

dev: ## Start all services and run Go app with hot reload
	docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Services ready!"
	@echo "📊 Dashboard URLs:"
	@echo "   - API: http://localhost:8080"
	@echo "   - FlareSolverr: http://localhost:8191"
	@echo "   - Meilisearch: http://localhost:7700"
	@echo "   - MinIO Console: http://localhost:9001"
	@echo "   - Adminer (DB): http://localhost:8081"
	@echo ""
	@echo "🚀 Starting Go backend with hot reload..."
	air

up: ## Start all Docker services
	docker-compose up -d
	@echo "✅ All services started!"
	@docker-compose ps

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Stop and remove all containers, volumes
	docker-compose down -v
	@echo "🧹 Cleaned up all containers and volumes"

ps: ## Show running containers
	docker-compose ps

run: ## Run Go application locally (without Docker)
	go run cmd/main.go

build: ## Build Go binary
	go build -o bin/api cmd/main.go

test: ## Run tests
	go test -v ./...

db-shell: ## Connect to PostgreSQL
	docker exec -it job_postgres psql -U postgres -d jobdb

redis-cli: ## Connect to Redis CLI
	docker exec -it job_redis redis-cli

rebuild: ## Rebuild and restart the backend container with all dependencies
	@echo "🔨 Rebuilding backend container..."
	docker-compose down
	docker-compose build --no-cache app
	docker-compose up -d postgres redis meilisearch minio flaresolverr app
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ Backend and all dependencies rebuilt and restarted!"
	@echo "📊 Service URLs:"
	@echo "   - API: http://localhost:8080"
	@echo "   - FlareSolverr: http://localhost:8191"
	@echo "   - Meilisearch: http://localhost:7700"
	@echo "   - MinIO Console: http://localhost:9001"
	@echo "🔍 Testing health endpoint..."
	@curl -s http://localhost:8080/health | jq || echo "Backend not ready yet"
