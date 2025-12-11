# Makefile for SPAYD Applied Project
# 
# Main App Build Commands:
#   make app-build      - Build main app (index.html, simple.html, batch.html)
#   make app-dev        - Run dev server for main app
#   make app-preview    - Preview production build
#   make app-deploy     - Build and copy to docs/app/ for GitHub Pages
#   make app-clean      - Clean dist/ directory
#
# FioFetch Docker Commands:
#   make build          - Build Docker image
#   make run            - Run container
#   make stop           - Stop container
#   make logs           - View logs (follow mode)
#   make clean          - Stop and remove container
#   make rebuild        - Stop, rebuild, and run
#   make shell          - Access container shell
#   make help           - Show this help message

.PHONY: help build run stop restart logs clean rebuild shell status health
.PHONY: app-build app-dev app-preview app-deploy app-clean

# Default image and container names
IMAGE_NAME ?= fiofetch
IMAGE_TAG ?= latest
CONTAINER_NAME ?= fiofetch
PORT ?= 3000

# Colors for output
COLOR_RESET = \033[0m
COLOR_BOLD = \033[1m
COLOR_GREEN = \033[32m
COLOR_BLUE = \033[34m
COLOR_YELLOW = \033[33m

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(COLOR_BOLD)FioFetch Docker Management$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_GREEN)Available targets:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_BLUE)%-15s$(COLOR_RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(COLOR_GREEN)Configuration:$(COLOR_RESET)"
	@echo "  IMAGE_NAME=$(IMAGE_NAME)"
	@echo "  IMAGE_TAG=$(IMAGE_TAG)"
	@echo "  CONTAINER_NAME=$(CONTAINER_NAME)"
	@echo "  PORT=$(PORT)"
	@echo ""
	@echo "$(COLOR_YELLOW)Examples:$(COLOR_RESET)"
	@echo "  make build                           # Build default image"
	@echo "  make run                             # Run container on port $(PORT)"
	@echo "  make PORT=8080 run                   # Run on custom port"
	@echo "  make IMAGE_TAG=v1.0.0 build          # Build with version tag"
	@echo "  make clean rebuild                   # Full rebuild workflow"

build: ## Build Docker image
	@echo "$(COLOR_GREEN)Building Docker image...$(COLOR_RESET)"
	./d10_build.sh $(IMAGE_NAME) $(IMAGE_TAG)

run: ## Run Docker container
	@echo "$(COLOR_GREEN)Starting Docker container...$(COLOR_RESET)"
	FIO_FETCH_PORT=$(PORT) CONTAINER_NAME=$(CONTAINER_NAME) ./d20_run.sh $(IMAGE_NAME) $(IMAGE_TAG)

stop: ## Stop Docker container
	@echo "$(COLOR_YELLOW)Stopping Docker container...$(COLOR_RESET)"
	./d30_stop.sh $(CONTAINER_NAME)

restart: stop run ## Restart Docker container

logs: ## View container logs (follow mode)
	@echo "$(COLOR_BLUE)Viewing logs for $(CONTAINER_NAME)...$(COLOR_RESET)"
	./d40_logs.sh $(CONTAINER_NAME) -f

logs-tail: ## View last 50 lines of logs
	@echo "$(COLOR_BLUE)Viewing last 50 lines of logs...$(COLOR_RESET)"
	./d40_logs.sh $(CONTAINER_NAME) --tail 50

clean: ## Stop and remove Docker container
	@echo "$(COLOR_YELLOW)Cleaning up Docker container...$(COLOR_RESET)"
	./d30_stop.sh $(CONTAINER_NAME) --remove

rebuild: clean build run ## Stop, rebuild, and run container

shell: ## Access container shell
	@echo "$(COLOR_BLUE)Opening shell in container...$(COLOR_RESET)"
	docker exec -it $(CONTAINER_NAME) /bin/bash

status: ## Show container status
	@echo "$(COLOR_GREEN)Container Status:$(COLOR_RESET)"
	@docker ps -a --filter name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true

health: ## Check container health
	@echo "$(COLOR_GREEN)Container Health:$(COLOR_RESET)"
	@docker inspect $(CONTAINER_NAME) --format='Status: {{.State.Status}}\nHealth: {{.State.Health.Status}}' 2>/dev/null || echo "Container not found"

ps: ## List all FioFetch containers
	@echo "$(COLOR_GREEN)FioFetch Containers:$(COLOR_RESET)"
	@docker ps -a --filter ancestor=$(IMAGE_NAME):$(IMAGE_TAG) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true

images: ## List FioFetch images
	@echo "$(COLOR_GREEN)FioFetch Images:$(COLOR_RESET)"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

clean-images: ## Remove FioFetch images
	@echo "$(COLOR_YELLOW)Removing FioFetch images...$(COLOR_RESET)"
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) || true

clean-all: clean clean-images ## Remove container and images

prune: ## Prune Docker system (careful!)
	@echo "$(COLOR_YELLOW)Pruning Docker system...$(COLOR_RESET)"
	docker system prune -f

dev: ## Run in development mode with logs following
	@make run
	@sleep 2
	@make logs

quick-check: status health ## Quick health check

# Docker Compose targets
compose-up: ## Start with docker-compose
	@echo "$(COLOR_GREEN)Starting with docker-compose...$(COLOR_RESET)"
	docker-compose up -d

compose-down: ## Stop docker-compose
	@echo "$(COLOR_YELLOW)Stopping docker-compose...$(COLOR_RESET)"
	docker-compose down

compose-logs: ## View docker-compose logs
	@echo "$(COLOR_BLUE)Viewing docker-compose logs...$(COLOR_RESET)"
	docker-compose logs -f

compose-rebuild: ## Rebuild with docker-compose
	@echo "$(COLOR_GREEN)Rebuilding with docker-compose...$(COLOR_RESET)"
	./d10_build.sh
	docker-compose up -d --force-recreate

# Main App Build Targets
app-build: ## Build main app (index.html, simple.html, batch.html)
	@echo "$(COLOR_GREEN)Building main app...$(COLOR_RESET)"
	yarn build

app-dev: ## Run dev server for main app
	@echo "$(COLOR_GREEN)Starting dev server...$(COLOR_RESET)"
	yarn dev

app-preview: ## Preview production build
	@echo "$(COLOR_GREEN)Previewing production build...$(COLOR_RESET)"
	yarn preview

app-deploy: app-build ## Build and copy to docs/app/ for GitHub Pages
	@echo "$(COLOR_GREEN)Deploying to docs/app/...$(COLOR_RESET)"
	./copy-dist-to-docs.sh

app-clean: ## Clean dist/ directory
	@echo "$(COLOR_YELLOW)Cleaning dist/ directory...$(COLOR_RESET)"
	rm -rf dist/

