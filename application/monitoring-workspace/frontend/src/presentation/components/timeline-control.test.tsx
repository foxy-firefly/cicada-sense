import "../../app/i18n.js";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineControl } from "./timeline-control.js";

describe("TimelineControl", () => {
  it("renders activity bars and changes windows", () => {
    const onChange = vi.fn();

    render(
      <TimelineControl
        alerts={[
          {
            createdAt: "2026-05-29T10:10:00.000Z",
            id: "alert-1",
            kind: "high_acoustic_activity",
            message: "High acoustic activity",
            siteId: "site-1",
            severity: "warning",
          },
        ]}
        onChange={onChange}
        timeline={[
          {
            acousticActivity: 7.2,
            alertCount: 1,
            emergenceProbability: 61,
            id: "timeline-1",
            observationCount: 12,
            timestamp: "2026-05-29T10:00:00.000Z",
          },
          {
            acousticActivity: 8.1,
            alertCount: 0,
            emergenceProbability: 64,
            id: "timeline-2",
            observationCount: 16,
            timestamp: "2026-05-29T10:30:00.000Z",
          },
        ]}
        value="24h"
      />,
    );

    expect(screen.getAllByLabelText("Timeline activity").length).toBeGreaterThan(0);
    expect(screen.getByText("Timeline · 24 Hours")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    expect(onChange).toHaveBeenCalledWith("7d");
  });
});
