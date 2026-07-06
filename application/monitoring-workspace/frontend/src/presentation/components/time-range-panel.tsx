import { WorkspaceViewModel } from "../../application/workspace-view-model.js";
import type { Site, TimeWindow, WorkspaceContext } from "../../domain/model.js";
import { messages } from "../messages.js";

interface TimeRangePanelProps {
  readonly onChange: (value: TimeWindow) => void;
  readonly selectedSite: Site | null;
  readonly timeWindow: TimeWindow;
  readonly workspace?: WorkspaceContext;
}

const WINDOWS: TimeWindow[] = ["1h", "6h", "24h", "7d", "season"];

export function TimeRangePanel({ onChange, selectedSite, timeWindow, workspace }: TimeRangePanelProps) {
  return (
    <section aria-label={messages.timeRange} className="time-range-panel">
      <div className="panel-heading panel-heading--stacked">
        <h2>{messages.timeRange}</h2>
        <p>{workspace?.name ?? messages.currentWorkspace}</p>
      </div>
      <div className="time-range-panel__site-card">
        <strong>{selectedSite?.name ?? messages.noSite}</strong>
        <span>{selectedSite?.habitatClass ?? messages.seasonalBroodFallback}</span>
        <span>{WorkspaceViewModel.formatCoordinates(selectedSite)}</span>
      </div>
      <fieldset className="time-range-panel__windows" aria-label={messages.timelineWindowLabel}>
        <legend className="sr-only">{messages.timelineWindowLabel}</legend>
        {WINDOWS.map((windowValue) => (
          <button
            aria-pressed={timeWindow === windowValue}
            className="time-range-panel__window-button"
            key={windowValue}
            onClick={() => onChange(windowValue)}
            type="button"
          >
            {windowValue}
          </button>
        ))}
      </fieldset>
    </section>
  );
}
