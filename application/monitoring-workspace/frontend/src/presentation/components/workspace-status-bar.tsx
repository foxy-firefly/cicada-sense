import type { WorkspaceSummary } from "../../application/workspace-view-model.js";
import { WorkspaceViewModel } from "../../application/workspace-view-model.js";
import type { SourceStatus, WeatherSummary, WorkspaceContext } from "../../domain/model.js";
import { messages } from "../messages.js";

interface WorkspaceStatusBarProps {
  readonly freshnessSummary: Record<SourceStatus, number>;
  readonly summary: WorkspaceSummary;
  readonly weather?: WeatherSummary;
  readonly workspace?: WorkspaceContext;
}

export function WorkspaceStatusBar({ freshnessSummary, summary, weather, workspace }: WorkspaceStatusBarProps) {
  return (
    <footer className="workspace-status-bar">
      <dl className="workspace-status-bar__metrics">
        <div>
          <dt>{messages.footerMode}</dt>
          <dd>{workspace?.mode ?? "live"}</dd>
        </div>
        <div>
          <dt>{messages.statusOperational}</dt>
          <dd>{summary.sites} sites</dd>
        </div>
        <div>
          <dt>{messages.onlineSensors}</dt>
          <dd>{summary.onlineSensors}</dd>
        </div>
        <div>
          <dt>{messages.dataStreams}</dt>
          <dd>{summary.dataStreams + freshnessSummary.stale}</dd>
        </div>
        <div>
          <dt>{messages.alerts}</dt>
          <dd>{summary.activeAlerts}</dd>
        </div>
        <div>
          <dt>{messages.footerObservations}</dt>
          <dd>{summary.observations}</dd>
        </div>
        <div>
          <dt>{messages.footerUpdated}</dt>
          <dd>{workspace ? WorkspaceViewModel.formatTimestamp(workspace.timestamp) : "--"}</dd>
        </div>
        <div>
          <dt>{messages.headerTemperature}</dt>
          <dd>{weather ? `${weather.temperatureC.toFixed(1)} C` : "--"}</dd>
        </div>
      </dl>
    </footer>
  );
}
