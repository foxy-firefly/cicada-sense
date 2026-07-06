# Makefile for Cicada Sense.
# Root commands orchestrate Docker Compose only; Node tooling lives inside app containers.

.PHONY: help install setup setup-traefik build up down logs shell lint lint-fix typecheck test docs-check ci helm-docs helm-tests clean

MAKEFLAGS += --silent
.DEFAULT_GOAL := help

LOCAL_UID := $(shell id -u)
LOCAL_GID := $(shell id -g)
HOST_WORKSPACE_ROOT := $(shell \
	current_dir="$(CURDIR)"; \
	if [ -f /.dockerenv ] && docker inspect "$$(hostname)" >/dev/null 2>&1; then \
		host_dir="$$(docker inspect "$$(hostname)" --format '{{range .Mounts}}{{if eq .Destination "'$$current_dir'"}}{{.Source}}{{end}}{{end}}')"; \
		if [ -n "$$host_dir" ]; then printf '%s' "$$host_dir"; else printf '%s' "$$current_dir"; fi; \
	else \
		printf '%s' "$$current_dir"; \
	fi)
COMPOSE := HOST_WORKSPACE_ROOT=$(HOST_WORKSPACE_ROOT) LOCAL_UID=$(LOCAL_UID) LOCAL_GID=$(LOCAL_GID) COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose
APP_RUN = $(COMPOSE) run --rm -T --no-deps --remove-orphans
APP_SERVICES := backend frontend live-data-generator
APP_START_WAIT_TIMEOUT ?= 180
TRAEFIK_DASHBOARD_PORT ?= 8080
TRAEFIK_IMAGE ?= traefik:v3

GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m

help: ## Show help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(GREEN)Cicada Sense$(NC)\n\nUsage:\n  make $(YELLOW)<target>$(NC)\n"} /^[$$()% 0-9a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-26s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: setup-traefik ## Build local app images and install app dependencies inside them
	@$(COMPOSE) build $(APP_SERVICES)

setup: setup-traefik up ## Build and start the local stack
	@echo "$(GREEN)Application available at:$(NC)"
	@echo "  Dashboard: $(YELLOW)http://cicada-sense.localhost$(NC)"
	@echo "  Generator: $(YELLOW)http://generator.cicada-sense.localhost$(NC)"
	@echo "  Traefik:   $(YELLOW)http://traefik.localhost:$(TRAEFIK_DASHBOARD_PORT)$(NC)"

setup-traefik: ## Setup the shared local Traefik gateway
	@TRAEFIK_NETWORK=traefik-proxy; \
	TRAEFIK_NAME=traefik-local; \
	check_traefik_ports() { \
		echo "Checking traefik host ports availability"; \
		TRAEFIK_HTTP_PORT=80; \
		TRAEFIK_PORT_CHECK_NAME="traefik-port-check-$$$$"; \
		if [ "$(TRAEFIK_DASHBOARD_PORT)" = "$$TRAEFIK_HTTP_PORT" ]; then \
			echo "$(RED)TRAEFIK_DASHBOARD_PORT must differ from port $$TRAEFIK_HTTP_PORT.$(NC)"; \
			exit 1; \
		fi; \
		docker image inspect $(TRAEFIK_IMAGE) >/dev/null 2>&1 || docker pull $(TRAEFIK_IMAGE) >/dev/null; \
		docker rm -f "$$TRAEFIK_PORT_CHECK_NAME" >/dev/null 2>&1 || true; \
		if ! docker run -d --rm --name "$$TRAEFIK_PORT_CHECK_NAME" -p $$TRAEFIK_HTTP_PORT:80 -p $(TRAEFIK_DASHBOARD_PORT):8080 $(TRAEFIK_IMAGE) version >/dev/null 2>&1; then \
			echo "$(RED)Required Traefik host ports are unavailable: 80 and/or $(TRAEFIK_DASHBOARD_PORT). Set TRAEFIK_DASHBOARD_PORT=<port> or free the conflicting listener before running make setup.$(NC)"; \
			exit 1; \
		fi; \
		docker rm -f "$$TRAEFIK_PORT_CHECK_NAME" >/dev/null 2>&1 || true; \
	}; \
	create_traefik_container() { \
		echo "Creating traefik container"; \
		docker pull $(TRAEFIK_IMAGE) >/dev/null; \
		docker run -d \
			-p 80:80 -p $(TRAEFIK_DASHBOARD_PORT):8080 \
			-v /var/run/docker.sock:/var/run/docker.sock:ro \
			--restart unless-stopped --name $$TRAEFIK_NAME --network=$$TRAEFIK_NETWORK \
			--label "traefik.enable=true" --label "traefik.http.routers.traefik.rule=Host(\`traefik.localhost\`)" --label "traefik.http.routers.traefik.service=api@internal" \
			$(TRAEFIK_IMAGE) \
			--api.insecure=true --providers.docker.exposedByDefault=false --providers.docker.network=$$TRAEFIK_NETWORK --entrypoints.http.address=:80 --accessLog=true >/dev/null; \
	}; \
	docker network inspect $$TRAEFIK_NETWORK >/dev/null 2>&1 || (echo "Creating traefik network" && docker network create $$TRAEFIK_NETWORK >/dev/null); \
	if docker ps -a --format '{{.Names}}' | grep -q "^$$TRAEFIK_NAME$$"; then \
		echo "Traefik container already exists"; \
		CURRENT_DASHBOARD_PORT="$$(docker inspect -f '{{with index .HostConfig.PortBindings "8080/tcp"}}{{(index . 0).HostPort}}{{end}}' $$TRAEFIK_NAME)"; \
		if [ "$$CURRENT_DASHBOARD_PORT" != "$(TRAEFIK_DASHBOARD_PORT)" ]; then \
			echo "Recreating traefik container to use dashboard port $(TRAEFIK_DASHBOARD_PORT)"; \
			check_traefik_ports; \
			docker rm -f $$TRAEFIK_NAME >/dev/null; \
			create_traefik_container; \
		else \
			if [ "$$(docker inspect -f '{{.State.Running}}' $$TRAEFIK_NAME)" != "true" ]; then \
				check_traefik_ports; \
				echo "Starting traefik container" && docker start $$TRAEFIK_NAME >/dev/null; \
			fi; \
			if ! docker inspect -f '{{json .NetworkSettings.Networks}}' $$TRAEFIK_NAME | grep -q '"'$$TRAEFIK_NETWORK'"'; then \
				echo "Traefik container is not connected to '$$TRAEFIK_NETWORK' network" && exit 1; \
			fi; \
		fi; \
	else \
		check_traefik_ports; \
		create_traefik_container; \
	fi

build: setup-traefik ## Build local Docker images, optionally with SERVICE=<name>
	@$(COMPOSE) build $(SERVICE)

up: setup-traefik ## Start the local application stack
	@$(COMPOSE) up --remove-orphans --build -d --wait --wait-timeout $(APP_START_WAIT_TIMEOUT)

down: ## Stop the local application stack
	@$(COMPOSE) down --remove-orphans

logs: ## Tail local logs, optionally with SERVICE=<name>
	@if [ -n "$(SERVICE)" ]; then $(COMPOSE) logs -f $(SERVICE); else $(COMPOSE) logs -f; fi

shell: ## Open a service shell with SERVICE=<name>
	@if [ -z "$(SERVICE)" ]; then echo "$(RED)Usage: make shell SERVICE=backend$(NC)"; exit 1; fi
	@$(COMPOSE) run --rm --no-deps --remove-orphans -it $(SERVICE) sh

lint: setup-traefik ## Run app lint inside containers
	$(call npm-app,run lint)
	$(call run_linter)

lint-fix: setup-traefik ## Run app lint and fix inside containers
	$(call npm-app,run lint:fix)
	$(MAKE) linter-fix

linter-fix: ## Execute linting and fix
	$(call run_linter, \
		-e FIX_SPELL_CODESPELL=true \
		-e FIX_MARKDOWN=true \
		-e FIX_MARKDOWN_PRETTIER=true \
		-e FIX_YAML_PRETTIER=true \
		-e FIX_NATURAL_LANGUAGE=true \
		-e FIX_SHELL_SHFMT=true \
		-e FIX_BIOME_LINT=true \
		-e FIX_BIOME_FORMAT=true \
	)

define run_linter
	DEFAULT_WORKSPACE="$(CURDIR)"; \
	LINTER_IMAGE="linter:latest"; \
	VOLUME="$(HOST_WORKSPACE_ROOT):$$DEFAULT_WORKSPACE"; \
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --tag $$LINTER_IMAGE .; \
	docker run \
		-e DEFAULT_WORKSPACE="$$DEFAULT_WORKSPACE" \
		-e FILTER_REGEX_INCLUDE="$(filter-out $@,$(MAKECMDGOALS))" \
		$(1) \
		-v $$VOLUME \
		--rm \
		$$LINTER_IMAGE
endef

define with_tools
	@tool() { \
		if command -v "$$1" >/dev/null 2>&1; then \
			"$$@"; \
		elif command -v mise >/dev/null 2>&1; then \
			mise exec -- "$$@"; \
		else \
			echo "$(RED)Missing required tool: $$1. Install it or run 'mise install'.$(NC)"; \
			exit 127; \
		fi; \
	}; \
	$(1)
endef

typecheck: setup-traefik ## Run TypeScript checks inside containers
	$(call npm-app,run typecheck)

test: setup-traefik ## Run unit and integration tests inside containers
	@$(COMPOSE) up -d --wait postgres redis
	$(call npm-app, run test:ci)

helm-docs: ## Generate Helm chart documentation
	$(call with_tools, \
		if command -v helm-docs >/dev/null 2>&1 || command -v mise >/dev/null 2>&1; then \
			tool helm-docs --chart-search-root ./charts; \
		else \
			echo "helm-docs is not installed; skipping chart docs generation"; \
		fi \
	)

helm-tests: ## Run Helm packaging and lint/template checks
	$(call with_tools, \
		mkdir -p ./charts/dist; \
		tool helm dependency build ./charts/application; \
		tool helm package ./charts/application --destination ./charts/dist; \
		tool ct lint; \
		tool helm dependency build ./charts/application; \
		tool helm template cicada-sense ./charts/application --namespace cicada-sense >/dev/null \
	)

ci: build helm-docs typecheck test helm-tests ## Run the full containerized validation suite

clean: ## Remove generated containers, volumes, and ignored local artifacts
	@$(COMPOSE) down --volumes --remove-orphans
	@rm -rf application/monitoring-workspace/backend/node_modules application/monitoring-workspace/frontend/node_modules application/live-data-generator/node_modules application/monitoring-workspace/backend/dist application/monitoring-workspace/frontend/dist application/live-data-generator/dist application/live-data-generator/dist-types node_modules charts/dist charts/application/charts/*.tgz

define npm-app
	@for service in $(APP_SERVICES); do \
		echo "$(YELLOW)$$service$(NC): npm $(1)"; \
		$(APP_RUN) $$service node-dev-entrypoint npm $(1) || exit $$?; \
	done
endef

define run_linter
	DEFAULT_WORKSPACE="$(CURDIR)"; \
	LINTER_IMAGE="linter:latest"; \
	VOLUME="$(HOST_WORKSPACE_ROOT):$$DEFAULT_WORKSPACE"; \
	docker build --platform linux/amd64 --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --tag $$LINTER_IMAGE .; \
	docker run \
		--platform linux/amd64 \
		-v $$VOLUME \
		--rm \
		-e DEFAULT_WORKSPACE="$$DEFAULT_WORKSPACE" \
		-e FILTER_REGEX_INCLUDE="$(filter-out $@,$(MAKECMDGOALS))" \
		-e IGNORE_GITIGNORED_FILES=true \
		$(1) \
		$$LINTER_IMAGE
endef
