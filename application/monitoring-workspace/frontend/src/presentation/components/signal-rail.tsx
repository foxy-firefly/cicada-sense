import { Area, AreaChart, Line, LineChart } from "recharts";
import { DashboardViewModel } from "../../application/dashboard-view-model.js";
import { WorkspaceViewModel } from "../../application/workspace-view-model.js";
import type { Alert, DashboardSignalSummary, Detection, SourceStatus, TimelinePoint } from "../../domain/model.js";
import { messages } from "../messages.js";

interface SignalRailProps {
  readonly activeDetectionCount: number;
  readonly alerts: readonly Alert[];
  readonly detections: readonly Detection[];
  readonly freshnessSummary: Record<SourceStatus, number>;
  readonly summary?: DashboardSignalSummary;
  readonly timeline?: readonly TimelinePoint[];
}

function describeFreshness(summary: ReturnType<typeof DashboardViewModel.summarizeSignalRail>): string {
  switch (summary.freshnessKind) {
    case "warning":
      return `${summary.freshnessCount} ${messages.sourceFreshnessError.toLowerCase()}`;
    case "stale":
      return `${summary.freshnessCount} ${messages.sourceFreshnessStale.toLowerCase()}`;
    case "active":
      return `${summary.freshnessCount} ${messages.sourceFreshnessActive.toLowerCase()}`;
    case "none":
      return messages.noData;
  }
}

function describeConfidence(summary: ReturnType<typeof DashboardViewModel.summarizeSignalRail>): string {
  return summary.confidencePercent === null ? messages.noData : `${summary.confidencePercent}%`;
}

function describeAnomaly(summary: ReturnType<typeof DashboardViewModel.summarizeSignalRail>): string {
  switch (summary.anomalyKind) {
    case "no-data":
      return messages.noData;
    case "outage":
      return messages.signalAnomalyOutage;
    case "stale":
      return messages.signalAnomalyStale;
    case "alert":
      return summary.anomalyMessage ?? messages.calmConditions;
    case "calm":
      return messages.calmConditions;
  }
}

export function SignalRail({
  activeDetectionCount,
  alerts,
  detections,
  freshnessSummary,
  summary: snapshotSummary,
  timeline = [],
}: SignalRailProps) {
  const summary = DashboardViewModel.summarizeSignalRail(detections, alerts, freshnessSummary, activeDetectionCount);
  const sparklineData = timeline.slice(-12).map((point) => ({
    acoustic: point.acousticActivity,
    emergence: point.emergenceProbability,
    label: new Date(point.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  }));
  const freshnessLabel = snapshotSummary
    ? WorkspaceViewModel.formatFreshnessSeconds(snapshotSummary.dataFreshnessSeconds)
    : describeFreshness(summary);

  return (
    <aside className="signal-rail" aria-label={messages.signalRail}>
      <div className="signal-rail__header">
        <h2>{messages.signalOverview}</h2>
        <span className="status-pill">{messages.live}</span>
      </div>

      <div className="signal-rail__cards">
        <section className="signal-card signal-card--accent">
          <div className="signal-card__header-row">
            <p className="signal-card__label">{messages.signalSummaryAcoustic}</p>
            <span className="signal-card__status">{messages.live}</span>
          </div>
          <strong className="signal-card__value">
            {snapshotSummary
              ? `${snapshotSummary.acousticActivity.toFixed(1)} / 10`
              : (summary.activeDetectionValue ?? messages.noData)}
          </strong>
          <div className="signal-card__chart">
            <LineChart data={sparklineData} height={40} width={280}>
              <Line dataKey="acoustic" dot={false} stroke="var(--data-acoustic)" strokeWidth={2.4} type="monotone" />
            </LineChart>
          </div>
          <span className="signal-card__meta">{messages.signalSummarySeverityHigh}</span>
        </section>

        <section className="signal-card">
          <div className="signal-card__header-row">
            <p className="signal-card__label">{messages.signalSummaryEmergence}</p>
            <span className="signal-card__status">{messages.live}</span>
          </div>
          <strong className="signal-card__value">
            {snapshotSummary ? `${snapshotSummary.emergenceProbability}%` : messages.noData}
          </strong>
          <div className="signal-card__chart">
            <AreaChart data={sparklineData} height={40} width={280}>
              <Area
                dataKey="emergence"
                fill="var(--data-emergence-soft)"
                stroke="var(--data-emergence)"
                strokeWidth={2.2}
                type="monotone"
              />
            </AreaChart>
          </div>
          <span className="signal-card__meta">{messages.signalSummarySeverityHigh}</span>
        </section>

        <section className="signal-card">
          <div className="signal-card__header-row">
            <p className="signal-card__label">{messages.signalSummarySpecies}</p>
            <span className="signal-card__status">{messages.live}</span>
          </div>
          <strong className="signal-card__value">
            {snapshotSummary ? `${snapshotSummary.speciesConfidence}%` : describeConfidence(summary)}
          </strong>
          <div className="signal-card__progress">
            <span
              aria-hidden="true"
              className="signal-card__progress-bar"
              style={{ width: `${snapshotSummary?.speciesConfidence ?? summary.confidencePercent ?? 0}%` }}
            />
          </div>
          <span className="signal-card__meta">{messages.signalSummarySeverityHigh}</span>
        </section>

        <section className="signal-card">
          <div className="signal-card__header-row">
            <p className="signal-card__label">{messages.signalSummaryFreshness}</p>
            <span className="signal-card__status">{messages.signalSummaryFreshnessGood}</span>
          </div>
          <strong className="signal-card__value signal-card__value--small">{freshnessLabel}</strong>
          <div className="signal-card__mini-metrics">
            <span>{messages.sourceFreshness}</span>
            <span>{describeFreshness(summary)}</span>
          </div>
        </section>
      </div>

      <section aria-label={messages.signalSummaryAnomalies} className="signal-rail__anomalies">
        <h3>{messages.signalSummaryAnomalies}</h3>
        <p>{describeAnomaly(summary)}</p>
      </section>

      <section aria-label={messages.recentAlerts} className="signal-rail__alerts">
        <div className="signal-rail__section-heading">
          <h3>{messages.recentAlerts}</h3>
          <button type="button">{messages.viewAll}</button>
        </div>
        {summary.recentAlerts.length > 0 ? (
          <ul className="alert-list">
            {summary.recentAlerts.map((alert) => (
              <li key={alert.id} data-severity={alert.severity}>
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
    </aside>
  );
}
