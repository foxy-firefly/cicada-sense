import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Alert, TimelinePoint, TimeWindow } from "../../domain/model.js";
import { messages } from "../messages.js";

interface TimelineControlProps {
  readonly alerts: readonly Alert[];
  readonly timeline: readonly TimelinePoint[];
  readonly value: TimeWindow;
  readonly onChange: (value: TimeWindow) => void;
}

const WINDOWS: TimeWindow[] = ["1h", "6h", "24h", "7d", "season"];

function buildTimelinePoints(timeline: readonly TimelinePoint[], value: TimeWindow): readonly TimelinePoint[] {
  switch (value) {
    case "1h":
      return timeline.slice(-2);
    case "6h":
      return timeline.slice(-12);
    case "24h":
      return timeline.slice(-48);
    case "7d":
    case "season":
      return timeline;
  }
}

export function TimelineControl({ alerts, timeline, value, onChange }: TimelineControlProps) {
  const points = buildTimelinePoints(timeline, value).map((point) => ({
    ...point,
    label: new Date(point.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  }));
  const peakCount = Math.max(...points.map((point) => point.observationCount), 0);

  return (
    <section className="timeline-panel" aria-label={messages.timelineActivity}>
      <div className="panel-heading">
        <h2>{messages.timeline24Hours}</h2>
        <span className="status-pill">{messages.timelineLiveBadge}</span>
      </div>
      <section aria-label={messages.timelineActivity} className="timeline-chart">
        <div className="timeline-chart__summary">
          <p>{messages.timelineActivitySummary}</p>
          <div className="timeline-chart__chips">
            <span className="timeline-chip">
              <strong>{messages.timelineWindowLabel}</strong>
              <span>{value}</span>
            </span>
            <span className="timeline-chip">
              <strong>{messages.timelineAlerts}</strong>
              <span>{alerts.length}</span>
            </span>
            <span className="timeline-chip">
              <strong>{messages.timelinePeak}</strong>
              <span>{peakCount}</span>
            </span>
          </div>
        </div>
        <div className="timeline-chart__canvas">
          <ResponsiveContainer height={168} width="100%">
            <LineChart data={points}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Legend />
              <Line
                dataKey="acousticActivity"
                dot={false}
                name={messages.signalSummaryAcoustic}
                stroke="var(--data-acoustic)"
                strokeWidth={2.4}
                type="monotone"
              />
              <Line
                dataKey="emergenceProbability"
                dot={false}
                name={messages.signalSummaryEmergence}
                stroke="var(--data-emergence)"
                strokeWidth={2.1}
                type="monotone"
              />
              <Line
                dataKey="observationCount"
                dot={false}
                name={messages.timelineObservations}
                stroke="var(--data-observation)"
                strokeWidth={2}
                type="monotone"
              />
              {points
                .filter((point) => point.alertCount > 0)
                .map((point) => (
                  <ReferenceDot
                    fill="var(--status-warning)"
                    key={point.id}
                    r={4}
                    stroke="var(--status-warning)"
                    x={point.label}
                    y={point.acousticActivity}
                  />
                ))}
              <Brush dataKey="label" height={24} stroke="var(--data-acoustic)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="timeline-chart__controls">
          {WINDOWS.map((windowValue) => (
            <button
              aria-pressed={value === windowValue}
              key={windowValue}
              onClick={() => onChange(windowValue)}
              type="button"
            >
              {windowValue}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
