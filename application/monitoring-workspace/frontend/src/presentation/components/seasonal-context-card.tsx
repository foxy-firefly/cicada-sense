import type { Site } from "../../domain/model.js";
import { messages } from "../messages.js";

interface SeasonalContextCardProps {
  readonly site: Site | null;
}

export function SeasonalContextCard({ site }: SeasonalContextCardProps) {
  const progress = site?.seasonProgress;
  const progressPercent = progress ? Math.round((progress.currentDay / progress.totalDays) * 100) : 0;

  return (
    <aside aria-label={messages.seasonalContext} className="seasonal-context-card">
      <div className="panel-heading panel-heading--stacked">
        <h2>{messages.seasonalContext}</h2>
        <p>{site?.broodLabel ?? messages.seasonalBroodFallback}</p>
      </div>
      <dl className="seasonal-context-card__facts">
        <div>
          <dt>{messages.seasonalEmergenceWindow}</dt>
          <dd>{site?.emergenceWindow ? `${site.emergenceWindow.start} - ${site.emergenceWindow.end}` : "--"}</dd>
        </div>
        <div>
          <dt>{messages.seasonalProgress}</dt>
          <dd>{progress ? `Day ${progress.currentDay} / ${progress.totalDays}` : "--"}</dd>
        </div>
      </dl>
      <div className="seasonal-context-card__meter">
        <div
          aria-hidden="true"
          className="seasonal-context-card__meter-ring"
          style={{
            background: `conic-gradient(var(--data-acoustic) 0 ${progressPercent}%, var(--bg-panel-raised) ${progressPercent}% 100%)`,
          }}
        >
          <span>{progressPercent}%</span>
        </div>
        <div className="seasonal-context-card__meter-copy">
          <strong>{site?.name ?? messages.noSite}</strong>
          <span>{site?.habitatClass ?? messages.seasonalSummary}</span>
        </div>
      </div>
    </aside>
  );
}
