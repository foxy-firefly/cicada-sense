import { Bell, Building2, CircleHelp, CloudRain, Droplets, MoreHorizontal, Search, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { WorkspaceViewModel } from "../../application/workspace-view-model.js";
import type { WeatherSummary, WorkspaceContext } from "../../domain/model.js";
import type { ThemePreference } from "../../domain/theme-preference.js";
import { messages } from "../messages.js";
import { ThemeToggle } from "./theme-toggle.js";

interface DashboardTopBarProps {
  readonly themePreference: ThemePreference;
  readonly onThemeChange: (themePreference: ThemePreference) => void;
  readonly weather?: WeatherSummary;
  readonly workspace?: WorkspaceContext;
}

function TelemetryItem({
  compact = false,
  icon,
  label,
  value,
}: {
  readonly compact?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <section
      className={`top-command-bar__telemetry-item ${compact ? "top-command-bar__telemetry-item--compact" : ""}`}
      aria-label={`${label} ${value}`}
    >
      <span aria-hidden="true" className="top-command-bar__telemetry-icon">
        {icon}
      </span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </section>
  );
}

export function DashboardTopBar({ themePreference, onThemeChange, weather, workspace }: DashboardTopBarProps) {
  const chromeSummary = WorkspaceViewModel.buildWorkspaceChromeSummary(workspace, weather);

  return (
    <header className="top-command-bar">
      <div className="top-command-bar__brand">
        <span aria-hidden="true" className="top-command-bar__brand-mark">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <title>Cicada Sense</title>
            <path
              d="M24 8c4 0 7 2 9 5l-4 2c-1-1-3-2-5-2s-4 1-5 2l-4-2c2-3 5-5 9-5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
            <path
              d="M17 18c0-2 3-4 7-4s7 2 7 4v6c0 6-3 11-7 16-4-5-7-10-7-16v-6Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
            <path
              d="M13 20l-5 3m32-3 5 3M16 27l-7 6m30-6 7 6M24 17v23"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
          </svg>
        </span>
        <div className="top-command-bar__identity">
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
      </div>

      <div className="top-command-bar__center">
        <section className="top-command-bar__live-strip" aria-label={messages.headerWorkspaceTime}>
          <span className="status-pill">{messages.live}</span>
          <span>{chromeSummary.workspaceName}</span>
          <span>{chromeSummary.timestampLabel}</span>
        </section>
        <dl
          className="top-command-bar__telemetry top-command-bar__telemetry--header"
          aria-label={messages.headerConditions}
        >
          <TelemetryItem
            compact
            icon={<CloudRain size={16} />}
            label={messages.headerTemperature}
            value={`${chromeSummary.temperatureC.toFixed(1)} C`}
          />
          <TelemetryItem
            compact
            icon={<Droplets size={16} />}
            label={messages.headerHumidity}
            value={`${chromeSummary.humidityPercent}%`}
          />
          <TelemetryItem
            compact
            icon={<Wind size={16} />}
            label={messages.headerWind}
            value={`${chromeSummary.windDirection} ${chromeSummary.windSpeedKmh} km/h`}
          />
          <TelemetryItem
            compact
            icon={<CloudRain size={16} />}
            label={messages.headerPrecipitation}
            value={`${chromeSummary.precipitationMmH} mm/h`}
          />
        </dl>
      </div>

      <div className="top-command-bar__controls">
        <label className="command-search" htmlFor="workspace-search">
          <span className="sr-only">{messages.globalSearch}</span>
          <Search aria-hidden="true" size={16} />
          <input id="workspace-search" placeholder={messages.globalSearchPlaceholder} type="search" />
        </label>
        <button aria-label={messages.headerNotifications} className="command-icon-button" type="button">
          <Bell size={16} />
        </button>
        <details className="top-command-bar__overflow">
          <summary aria-label={messages.headerMore} className="command-icon-button top-command-bar__overflow-trigger">
            <MoreHorizontal size={16} />
          </summary>
          <div className="top-command-bar__overflow-panel">
            <section className="top-command-bar__overflow-section">
              <h2>{messages.headerMore}</h2>
              <button aria-label={messages.headerSupport} className="top-command-bar__menu-button" type="button">
                <CircleHelp size={16} />
                <span>{messages.headerSupport}</span>
              </button>
            </section>

            <section className="top-command-bar__overflow-section">
              <h3>{messages.headerOrganization}</h3>
              <button
                aria-label={messages.headerOrganization}
                className="organization-switcher top-command-bar__menu-button"
                type="button"
              >
                <Building2 size={16} />
                <span>{chromeSummary.organizationName}</span>
              </button>
              <div className="operator-chip top-command-bar__menu-card">
                <span aria-hidden="true" className="operator-chip__avatar">
                  ER
                </span>
                <span className="operator-chip__copy">
                  <strong>Emilien R.</strong>
                  <span>{chromeSummary.roleName}</span>
                </span>
              </div>
            </section>
            <section className="top-command-bar__overflow-section top-command-bar__overflow-section--theme">
              <ThemeToggle themePreference={themePreference} onChange={onThemeChange} />
            </section>
          </div>
        </details>
      </div>
    </header>
  );
}
