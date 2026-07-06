import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useTheme } from "../application/theme-state.js";
import { useDashboard } from "../application/use-dashboard.js";
import { WorkspaceViewModel } from "../application/workspace-view-model.js";
import { DashboardTopBar } from "./components/dashboard-top-bar.js";
import { LayerControls, type MapBaseStyle } from "./components/layer-controls.js";
import { MapWorkspace } from "./components/map-workspace.js";
import { PrimaryNavigation } from "./components/primary-navigation.js";
import { SeasonalContextCard } from "./components/seasonal-context-card.js";
import { SignalRail } from "./components/signal-rail.js";
import { TimeRangePanel } from "./components/time-range-panel.js";
import { TimelineControl } from "./components/timeline-control.js";
import { WorkspaceStatusBar } from "./components/workspace-status-bar.js";
import { messages } from "./messages.js";

function SkipToWorkspaceButton({ onFocusMain }: { readonly onFocusMain: () => void }) {
  return (
    <button className="skip-link" onClick={onFocusMain} type="button">
      {messages.skipToWorkspace}
    </button>
  );
}

export function MonitoringWorkspaceScreen() {
  const dashboard = useDashboard();
  const theme = useTheme();
  const mainContentRef = useRef<HTMLElement>(null);
  const [baseMapStyle, setBaseMapStyle] = useState<MapBaseStyle>(
    theme.resolvedTheme === "dark" ? "dark-relief" : "light-relief",
  );
  const workspaceSummary = WorkspaceViewModel.buildWorkspaceSummary(
    dashboard.data.sites,
    dashboard.data.sensors,
    dashboard.data.alerts,
    dashboard.freshnessSummary,
    dashboard.data.observations?.length ?? 0,
  );

  useEffect(() => {
    setBaseMapStyle((currentValue) => {
      if (currentValue === "topographic" || currentValue === "satellite-compatible") {
        return currentValue;
      }

      return theme.resolvedTheme === "dark" ? "dark-relief" : "light-relief";
    });
  }, [theme.resolvedTheme]);

  function focusMainContent(_event?: MouseEvent<HTMLButtonElement>) {
    mainContentRef.current?.focus();
  }

  if (dashboard.isLoading) {
    return (
      <>
        <SkipToWorkspaceButton onFocusMain={focusMainContent} />
        <main
          aria-label="Monitoring workspace"
          className="monitoring-shell"
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
        >
          <p>{messages.loadingWorkspace}</p>
        </main>
      </>
    );
  }

  if (!dashboard.error && dashboard.data.sites.length === 0) {
    return (
      <>
        <SkipToWorkspaceButton onFocusMain={focusMainContent} />
        <main
          aria-label="Monitoring workspace"
          className="monitoring-shell"
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
        >
          <p>{messages.emptyWorkspace}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SkipToWorkspaceButton onFocusMain={focusMainContent} />
      <main
        aria-label="Monitoring workspace"
        className="monitoring-shell"
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
      >
        <DashboardTopBar
          onThemeChange={theme.setThemePreference}
          themePreference={theme.themePreference}
          weather={dashboard.data.weather}
          workspace={dashboard.data.workspace}
        />
        <PrimaryNavigation />
        <section aria-label={messages.layers} className="dashboard-operations-panel">
          <div className="dashboard-panel-heading">
            <h2>{messages.layers}</h2>
            <p>{messages.currentWorkspace}</p>
          </div>
          <LayerControls
            baseMapStyle={baseMapStyle}
            layerVisibility={dashboard.layerVisibility}
            onBaseMapStyleChange={setBaseMapStyle}
            onToggle={dashboard.setLayerEnabled}
          />
        </section>
        <section className="dashboard-map-region">
          <MapWorkspace
            alertZones={dashboard.data.alertZones}
            baseMapStyle={baseMapStyle}
            detections={dashboard.filteredDetections}
            habitatReadings={dashboard.data.habitatReadings}
            layerVisibility={dashboard.layerVisibility}
            observations={dashboard.data.observations}
            onSelectSite={dashboard.setSelectedSiteId}
            resolvedTheme={theme.resolvedTheme}
            selectedSiteId={dashboard.selectedSiteId}
            sensors={dashboard.data.sensors}
            sites={dashboard.data.sites}
            territories={dashboard.data.territories}
          />
        </section>
        <SignalRail
          activeDetectionCount={dashboard.activeDetectionCount}
          alerts={dashboard.data.alerts}
          detections={dashboard.filteredDetections}
          freshnessSummary={dashboard.freshnessSummary}
          summary={dashboard.data.summary}
          timeline={dashboard.data.timeline}
        />
        <TimeRangePanel
          onChange={dashboard.setTimeWindow}
          selectedSite={dashboard.selectedSite}
          timeWindow={dashboard.timeWindow}
          workspace={dashboard.data.workspace}
        />
        <TimelineControl
          alerts={dashboard.data.alerts}
          onChange={dashboard.setTimeWindow}
          timeline={dashboard.data.timeline ?? []}
          value={dashboard.timeWindow}
        />
        <SeasonalContextCard site={dashboard.selectedSite} />
        <WorkspaceStatusBar
          freshnessSummary={dashboard.freshnessSummary}
          summary={workspaceSummary}
          weather={dashboard.data.weather}
          workspace={dashboard.data.workspace}
        />
        {dashboard.error ? (
          <p className="dashboard-error-banner" role="alert">
            {dashboard.error}
          </p>
        ) : null}
      </main>
    </>
  );
}
