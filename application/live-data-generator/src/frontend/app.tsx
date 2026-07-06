import { useEffect, useRef, useState } from "react";
import type { FailureInjection, PlaybackState, Scenario } from "../shared/contracts.js";
import { generatorSourceIds } from "../shared/scenario-registry.js";
import { GeneratorClient } from "./generator-client.js";
import "./styles.css";

type FailureInjectionKind = FailureInjection["kind"];

const DEFAULT_SCENARIO_ID = "multi-site-campaign";
const DEFAULT_SPEED = 1;

const INITIAL_STATE: PlaybackState = {
  currentScenarioId: null,
  emittedEvents: [],
  isPlaying: false,
  speed: DEFAULT_SPEED,
};

export function GeneratorApp({ client = new GeneratorClient() }: { readonly client?: GeneratorClient }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const [selectedFailureKind, setSelectedFailureKind] = useState<FailureInjectionKind>("outage");
  const [selectedSourceId, setSelectedSourceId] = useState(generatorSourceIds[0] ?? "sensor-site-sainte-victoire-1");
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [state, setState] = useState<PlaybackState>(INITIAL_STATE);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    client
      .listScenarios()
      .then(setScenarios)
      .catch(() => setScenarios([]));
  }, [client]);

  useEffect(() => {
    if (hasAutoStarted.current) {
      return;
    }

    hasAutoStarted.current = true;
    client
      .start({ scenarioId: DEFAULT_SCENARIO_ID, speed: DEFAULT_SPEED })
      .then(setState)
      .catch(() => setState(INITIAL_STATE));
  }, [client]);

  return (
    <main className="generator-console">
      <header>
        <h1>Live Data Generator</h1>
        <p>Drive deterministic cicada monitoring scenarios through production ingestion contracts.</p>
      </header>
      <section className="generator-controls" aria-label="Scenario controls">
        <label>
          Scenario
          <select onChange={(event) => setSelectedScenarioId(event.target.value)} value={selectedScenarioId}>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Speed
          <select onChange={(event) => setSpeed(Number(event.target.value))} value={speed}>
            {[0.5, 1, 2, 4].map((option) => (
              <option key={option} value={option}>
                {option}x
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => client.start({ scenarioId: selectedScenarioId, speed }).then(setState)} type="button">
          Start
        </button>
        <button onClick={() => client.pause().then(setState)} type="button">
          Pause
        </button>
        <button onClick={() => client.stop().then(setState)} type="button">
          Stop
        </button>
        <button onClick={() => client.setSpeed({ speed }).then(setState)} type="button">
          Apply speed
        </button>
      </section>
      <section className="generator-controls" aria-label="Failure controls">
        <label>
          Failure mode
          <select
            onChange={(event) => setSelectedFailureKind(event.target.value as FailureInjectionKind)}
            value={selectedFailureKind}
          >
            <option value="outage">Outage</option>
            <option value="stale">Stale provider</option>
            <option value="low_confidence">Low confidence</option>
          </select>
        </label>
        <label>
          Source
          <select onChange={(event) => setSelectedSourceId(event.target.value)} value={selectedSourceId}>
            {generatorSourceIds.map((sourceId) => (
              <option key={sourceId} value={sourceId}>
                {sourceId}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => client.injectFailure({ kind: selectedFailureKind, sourceId: selectedSourceId }).then(setState)}
          type="button"
        >
          Inject failure
        </button>
      </section>
      <section aria-label="Emitted events" className="event-log">
        <h2>Emitted events</h2>
        <ol>
          {state.emittedEvents.map((event) => (
            <li key={`${event.sensorId}-${event.recordedAt}`}>{`${event.sensorId} intensity ${event.intensity}`}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
