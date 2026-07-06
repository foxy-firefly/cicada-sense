# Product

## Goal

Cicada Sense is a real-time monitoring workspace for cicada ecosystem activity, supported by deterministic fixture data and a live data generator for local development and CI.

## Core Experiences

- **Monitoring workspace**: Real-time dashboard showing sites, sensors, detections, alerts, and source health with live data updates.
- **Live data generator console**: Deterministic playback scenarios with manual controls for speed, failure injection, and event inspection.
- **Local and CI-safe development**: Auto-starting fixture flows that avoid real sensors and external credentials.

## Current Capabilities

### Generator Console

- **Auto-start on load**: "multi-site-campaign" scenario starts automatically (36 events, diverse network coverage).
- **7 deterministic scenarios**: Calm day, chorus spike, heat stress, sensor outage, stale weather, mixed confidence, multi-site campaign.
- **18 sensors across 6 sites**: Province monitoring network with species and confidence variance.
- **Playback controls**: Select scenario, adjust speed (0.5x–4x), pause/resume/stop.
- **Failure injection**: Inject outage, stale, or low-confidence failures at individual sensors.
- **Event logging**: Inspect every emitted event in real time.

### Monitoring Workspace

- **Dashboard components**:
  - Signal overview: Live acoustic intensity, emergence %, species confidence aggregates.
  - Freshness indicators: Per-sensor and global data currency with "0m 00s ago" formatting.
  - Map display: Sensor markers anchored to geographic coordinates, updated during pan/zoom.
  - Detection timeline: Recent events with filtering and export.
- **Real-time updates**: Socket.io connections push new detections and freshness updates without page reload.
- **Bootstrap initialization**: Single API call loads entire dashboard state on page load.
- **Responsive icons**: SVG favicon with theme-aware colors.

## Product Constraints

- Demo and fixture flows must be deterministic.
- Generated events must pass through the same validation contracts as production ingestion.
- Stories should stay small enough to implement, test, and review independently.

## User Workflows

### Developer Testing

1. Open monitoring workspace.
2. Generator auto-starts on page load with live events flowing in.
3. Observe Signal overview populating with acoustic, emergence, and species metrics.
4. Freshness indicator shows "Good" with current timestamp.
5. Map renders with sensor markers at geographic locations.

### Fixture Scenario Playback

1. Open generator console.
2. Select alternate scenario (e.g., "heat-stress").
3. Click Start — 22 events emit over 6.6 seconds (cadence 300ms).
4. Adjust speed to 4x — events emit 4x faster.
5. Inject sensor failure — outage event broadcasts immediately.
6. Inspect emitted events in console log.

### Production Ingestion Testing

1. Real sensors publish detection events to backend.
2. Backend normalizes events using identical contracts as generator.
3. Workspace displays real and fixture data using same pipeline.
4. Developers verify ingestion logic without touching real hardware.
