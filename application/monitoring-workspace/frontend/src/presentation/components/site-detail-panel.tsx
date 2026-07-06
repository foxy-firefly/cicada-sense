import { DashboardViewModel } from "../../application/dashboard-view-model.js";
import type { Alert, Detection, Sensor, Site, SourceHealth } from "../../domain/model.js";
import { messages } from "../messages.js";

interface SiteDetailPanelProps {
  readonly alerts: readonly Alert[];
  readonly detections: readonly Detection[];
  readonly sensors: readonly Sensor[];
  readonly site: Site | null;
  readonly sourceHealth: readonly SourceHealth[];
}

export function SiteDetailPanel({ alerts, detections, sensors, site, sourceHealth }: SiteDetailPanelProps) {
  if (!site) {
    return <aside className="site-panel">{messages.noSite}</aside>;
  }

  const summary = DashboardViewModel.summarizeSiteDetail(site, sensors, detections, sourceHealth, alerts);

  return (
    <aside className="site-panel" aria-label={messages.sitePanel}>
      <div className="site-panel__header">
        <h2>{site.name}</h2>
        <p>
          {messages.siteHabitatScore} {site.habitatScore} • {messages.siteCoordinates} {site.coordinates.latitude},{" "}
          {site.coordinates.longitude}
        </p>
      </div>

      <dl className="site-panel__metrics">
        <div>
          <dt>{messages.sensorsCount}</dt>
          <dd>{summary.siteSensors.length}</dd>
        </div>
        <div>
          <dt>{messages.activeDetections}</dt>
          <dd>{summary.siteDetections.length}</dd>
        </div>
        <div>
          <dt>{messages.sourceFreshnessActive}</dt>
          <dd>{summary.freshSources}</dd>
        </div>
      </dl>

      <section aria-label={messages.liveDetections} className="site-panel__section">
        <h3>{messages.liveDetections}</h3>
        {summary.siteDetections.length > 0 ? (
          <ul className="site-panel__list">
            {summary.siteDetections.map((detection) => (
              <li key={detection.id}>
                <strong>{detection.sensorId}</strong>
                <span>{`${Math.round(detection.confidence * 100)}% • intensity ${detection.intensity}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{messages.noDetectionsInWindow}</p>
        )}
      </section>

      <section aria-label={messages.sensorDiagnostics} className="site-panel__section">
        <h3>{messages.sensorDiagnostics}</h3>
        {summary.siteSensors.length > 0 ? (
          <ul className="site-panel__list">
            {summary.siteSensors.map((sensor) => {
              const sensorHealth = summary.siteHealth.find((source) => source.sourceId === sensor.id);
              return (
                <li key={sensor.id}>
                  <strong>{sensor.name}</strong>
                  <span>{`${sensor.status} • ${sensorHealth?.status ?? messages.noData}`}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{messages.noSensorsAtSite}</p>
        )}
      </section>

      <section aria-label={messages.alerts} className="site-panel__section">
        <h3>{messages.alerts}</h3>
        {summary.siteAlerts.length > 0 ? (
          <ul className="site-panel__list site-panel__list--alerts">
            {summary.siteAlerts.map((alert) => (
              <li key={alert.id}>
                <span className={`alert-badge alert-badge--${alert.severity}`}>
                  {DashboardViewModel.alertSeverityLabel(alert)}
                </span>
                <span>{alert.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{messages.noActiveAlerts}</p>
        )}
      </section>

      <section aria-label={messages.sourceFreshnessDetails} className="site-panel__section">
        <h3>{messages.sourceFreshness}</h3>
        {summary.siteHealth.length > 0 ? (
          <ul className="site-panel__list">
            {summary.siteHealth.map((source) => (
              <li key={source.sourceId}>
                <strong>{source.sourceId}</strong>
                <span>{`${source.status} • ${source.lastSeenAt ?? messages.noData}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{messages.noSourceFreshnessData}</p>
        )}
      </section>
    </aside>
  );
}
