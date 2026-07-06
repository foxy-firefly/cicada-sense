# Architecture

## Scope

Cicada Sense is split into two application boundaries:

- `application/monitoring-workspace`: the main monitoring product, with backend and frontend runtimes.
- `application/live-data-generator`: the deterministic fixture generator, with its own backend service, frontend console, and shared contracts.

## Principles

- Clean architecture boundaries are enforced by folder structure: `domain`, `application`, `infrastructure`, `presentation`, and `app`.
- Fixture and live-generator flows must use the same ingestion contracts as production flows.
- Shared deployment concerns are expressed through Docker Compose locally and Helm charts for Kubernetes.

## Runtime Surfaces

- Backend API and realtime gateway
- Frontend monitoring workspace
- Live data generator control API
- Live data generator console

## Deployment Surfaces

- Local stack: `compose.yaml`
- Container builds: `docker/`
- Kubernetes packaging: `charts/`
- CI and release workflows: `.github/workflows/`

## Data Flow

### Generator → Backend

1. **Console auto-starts** on mount with "multi-site-campaign" scenario (36 events).
2. **Playback service** materializes scenario events: offsets all timestamps relative to playback start using `(playbackStart + (eventTimestamp - referenceTimestamp))`.
3. **Event publisher** posts each event to backend `/api/ingestion/detection` using production ingestion contracts (identical to real sensors).
4. **Backend normalizes** events into detections, stores in database, broadcasts via Socket.io.

### Backend → Frontend

**Bootstrap endpoint** (`/api/bootstrap`) returns:

- Sites and sensors with geographic coordinates
- Recent detections (last 48 hours)
- Workspace summary: site/sensor counts, alert count, active data streams
- Timeline metadata for chart rendering

**Real-time updates** via Socket.io:

- New detection events update Signal overview (acoustic/emergence intensity, species confidence)
- Freshness metadata updated per-sensor

**Frontend displays**:

- Map with sensor markers projected using MapLibre's `map.project()` API
- Signal overview cards showing live aggregates
- Freshness indicators ("0m 00s ago" for current data, "No data" for undefined)

## Component Architecture

### Generator (`application/live-data-generator`)

- **ScenarioRegistry**: Static factory producing 7 deterministic scenarios; 18 sensors across 6 sites; parametric event generation (14–36+ events per scenario).
- **PlaybackService**: Manages playback state; materializes timestamps; publishes events; injects failures.
- **BackendEventPublisher**: HTTP client posting events to backend using production ingestion contracts.
- **GeneratorHttpServer**: Express-like HTTP server exposing control and state endpoints.
- **GeneratorApp (React)**: Auto-starting console for scenario selection, playback control, speed adjustment, failure injection, and event log display.

### Monitoring Workspace Backend

- **Bootstrap handler**: Single endpoint returning full dashboard state.
- **Ingestion pipeline**: Accepts detection events from generator and external sensors; normalizes; broadcasts.
- **Real-time gateway**: Socket.io server for live updates to connected clients.

### Monitoring Workspace Frontend

- **WorkspaceViewModel**: Static view model with formatters and builders (e.g., `formatFreshnessSeconds()`, `buildSensorMarkers()`).
- **MapWorkspace component**: Renders MapLibre GL canvas with deck.gl overlay layers; syncs sensor markers on render loop using map projection API.
- **Signal overview**: Real-time aggregates updated via Socket.io listeners.

## Key Implementation Details

### Timestamp Materialization

Event timestamps in scenarios are defined relative to a reference moment (e.g., "2026-05-29T10:00:00.000Z"). When playback starts:

```js
materializedTimestamp = playbackStart + (eventTimestamp - referenceTimestamp);
```

This ensures events always emit with current system time, regardless of scenario definition date.

### Sensor Marker Projection

Sensor markers are anchored to geographic coordinates using MapLibre's projection API:

```ts
const pixelCoord = map.project([lng, lat]);
const leftPercent = (pixelCoord.x / containerWidth) * 100;
const topPercent = (pixelCoord.y / containerHeight) * 100;
```

Markers sync on the map "render" event (not just "move") to track camera state during panning/zooming.

### Freshness Formatting

- `0 seconds` (current data): displays as "0m 00s ago"
- `undefined` (no data available): displays as "No data"
- Condition checks for `undefined` specifically (not falsy) to avoid treating 0 as missing.
