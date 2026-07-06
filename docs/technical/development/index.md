# Development

## Local Commands

- `make help`: list available root commands.
- `make install`: build local Docker images and install app dependencies inside them.
- `make setup`: prepare Traefik and start the full local stack.
- `make lint`: run application lint checks.
- `make typecheck`: run TypeScript checks.
- `make test`: run unit and integration tests.
- `make ci`: run the full local validation suite.
- `make down`: stop the local stack.

## Working Model

- Root commands are Docker-first.
- Application package managers are scoped inside application containers.
- Chart validation runs through the root `make helm` target.

## Dev Container

- `.devcontainer/` provides a Debian-based local development container backed by dev container features instead of a repository Dockerfile.
- `mise.toml` is the source of truth for the repository-scoped Helm and chart-validation tooling required by root Make targets, including `helm`, `helm-docs`, `ct`, `yamale`, and `yamllint`.
- Docker access is routed through the host Docker socket so `make setup`, `make lint`, `make test`, `make helm`, and `make ci` can run unchanged inside the dev container.
- Root `make` targets resolve the host workspace path automatically before invoking Docker Compose, so bind-mounted app sources work both from the dev container and from a local shell.

## Generator Console

The live data generator (`application/live-data-generator`) provides a deterministic fixture system:

- **Auto-start**: Console auto-starts the "multi-site-campaign" scenario on mount with 1x playback speed.
- **Parametric scenarios**: Scenarios generate 14–36+ events across 18 sensors (6 sites, 2–3 sensors per site) with configurable cadence, confidence, and intensity patterns.
- **Timestamp materialization**: Event timestamps offset relative to playback start, ensuring events always emit with current timestamps regardless of scenario definition date.
- **Failure injection**: Operators can inject outage, stale, or low-confidence failures at any sensor.
- **Source selector**: 18 sensor IDs available in dropdown for independent failure injection.

### Scenarios

| Scenario               | Events | Cadence | Focus                                                              |
| ---------------------- | ------ | ------- | ------------------------------------------------------------------ |
| calm-day               | 18     | 350ms   | Low-variance baseline across full territory                        |
| chorus-spike           | 24     | 250ms   | High-intensity chorus waves across active stations                 |
| heat-stress            | 22     | 300ms   | Activity rise on exposed habitats + southern pressure              |
| sensor-outage          | 14     | 320ms   | Monitoring continues while one station falls quiet                 |
| stale-weather-provider | 16     | 280ms   | Delayed freshness updates from external feed                       |
| mixed-confidence       | 20     | 290ms   | Confidence variance patterns across species and sites              |
| multi-site-campaign    | 36     | 260ms   | Full network activity during ecosystem survey (default auto-start) |

## Monitoring Workspace

### Bootstrap Flow

- Single `/api/bootstrap` endpoint returns entire dashboard state: sites, sensors, detections, summary (counts + health), workspace config, timeline.
- Bootstrap ensures initial page load displays current data without additional round-trips.

### Data Display

- **Signal Overview**: Acoustic and emergence intensity, species confidence — populated from bootstrap summary and updated via Socket.io.
- **Freshness**: "No data available" (undefined) vs "data is current" (0 seconds) correctly distinguished in UI.
- **Map markers**: Sensor positions projected using MapLibre GL `map.project([lng,lat])` API; synced on render loop for continuous updates during panning/zooming.
- **Favicon**: SVG favicon with theme-aware colors (green for monitoring, gold for generator) loaded from `/public/favicon.svg`.

## Change Expectations

- Keep docs aligned with architecture and setup changes.
- Add or update tests when behavior changes.
- Preserve a runnable local stack after each story-sized change.
