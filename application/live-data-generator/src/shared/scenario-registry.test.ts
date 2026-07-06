import { describe, expect, it } from "vitest";
import { scenarioSchema } from "./contracts.js";
import { ScenarioRegistry } from "./scenario-registry.js";

describe("ScenarioRegistry", () => {
  it("provides valid deterministic scenarios", () => {
    const scenarios = ScenarioRegistry.list();

    expect(scenarios.map((scenario) => scenario.id)).toContain("chorus-spike");
    for (const scenario of scenarios) {
      expect(() => scenarioSchema.parse(scenario)).not.toThrow();
    }
    expect(ScenarioRegistry.get("multi-site-campaign")?.events.length).toBeGreaterThanOrEqual(30);
    expect(ScenarioRegistry.list()).toEqual(scenarios);
  });
});
