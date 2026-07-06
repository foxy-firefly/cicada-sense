import { Activity, Flame, Info, Leaf, MapIcon, Moon, Radio, Sun, Thermometer, Volume2 } from "lucide-react";
import type { ComponentType } from "react";
import type { LayerKey, LayerVisibility } from "../../application/use-dashboard.js";
import { messages } from "../messages.js";

export type MapBaseStyle = "topographic" | "satellite-compatible" | "dark-relief" | "light-relief";

const LAYER_GROUPS: Array<{
  readonly title: string;
  readonly layers: Array<{
    readonly description: string;
    readonly icon: ComponentType<{ size?: number }>;
    readonly key: LayerKey;
    readonly label: string;
  }>;
}> = [
  {
    title: messages.layerGroupCore,
    layers: [
      { key: "acoustic", label: "Acoustic Activity", description: messages.layerDescriptionAcoustic, icon: Volume2 },
      { key: "species", label: "Emergence Probability", description: messages.layerDescriptionEmergence, icon: Flame },
      {
        key: "microclimate",
        label: "Temperature",
        description: messages.layerDescriptionTemperature,
        icon: Thermometer,
      },
      {
        key: "habitat",
        label: "Vegetation Health",
        description: messages.layerDescriptionVegetationHealth,
        icon: Leaf,
      },
    ],
  },
  {
    title: messages.layerGroupOperational,
    layers: [
      { key: "observations", label: "Observations", description: messages.layerDescriptionObservations, icon: Radio },
      {
        key: "sensorHealth",
        label: "Sensor Health",
        description: messages.layerDescriptionSensorHealth,
        icon: Activity,
      },
    ],
  },
];

const BASE_LAYERS: Array<{
  readonly icon: ComponentType<{ size?: number }>;
  readonly label: string;
  readonly value: MapBaseStyle;
}> = [
  { icon: MapIcon, label: messages.layerBaseTopographic, value: "topographic" },
  { icon: MapIcon, label: messages.layerBaseSatellite, value: "satellite-compatible" },
  { icon: Moon, label: messages.layerBaseDarkRelief, value: "dark-relief" },
  { icon: Sun, label: messages.layerBaseLightRelief, value: "light-relief" },
];

const LAYER_PRESETS: Array<{ readonly label: string; readonly value: LayerVisibility }> = [
  {
    label: messages.layerPresetSignal,
    value: {
      acoustic: true,
      species: true,
      microclimate: true,
      habitat: false,
      observations: false,
      sensorHealth: true,
    },
  },
  {
    label: messages.layerPresetField,
    value: {
      acoustic: false,
      species: true,
      microclimate: true,
      habitat: false,
      observations: true,
      sensorHealth: true,
    },
  },
  {
    label: messages.layerPresetAll,
    value: {
      acoustic: true,
      species: true,
      microclimate: true,
      habitat: true,
      observations: true,
      sensorHealth: true,
    },
  },
];

interface LayerControlsProps {
  readonly baseMapStyle: MapBaseStyle;
  readonly layerVisibility: LayerVisibility;
  readonly onBaseMapStyleChange: (baseMapStyle: MapBaseStyle) => void;
  readonly onToggle: (layer: LayerKey, isEnabled: boolean) => void;
}

export function LayerControls({ baseMapStyle, layerVisibility, onBaseMapStyleChange, onToggle }: LayerControlsProps) {
  function applyPreset(nextVisibility: LayerVisibility) {
    for (const [layerKey, isEnabled] of Object.entries(nextVisibility) as Array<[LayerKey, boolean]>) {
      onToggle(layerKey, isEnabled);
    }
  }

  return (
    <section className="layer-controls" aria-label="Map layers">
      <section className="layer-controls__presets" aria-label={messages.layerPresets}>
        <h3>{messages.layerPresets}</h3>
        <div className="layer-controls__preset-list">
          {LAYER_PRESETS.map((preset) => (
            <button
              className="layer-controls__preset-button"
              key={preset.label}
              onClick={() => applyPreset(preset.value)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {LAYER_GROUPS.map((group) => (
        <fieldset className="layer-controls__group" key={group.title}>
          <legend>{group.title}</legend>
          <div className="layer-controls__items">
            {group.layers.map((layer) => (
              <label key={layer.key} className="layer-row">
                <span className="layer-row__icon">
                  <layer.icon size={16} />
                </span>
                <span className="layer-row__copy">
                  <span className="layer-row__title">{layer.label}</span>
                  <span className="layer-row__description">{layer.description}</span>
                </span>
                <button aria-label={`${layer.label} info`} className="layer-row__info" type="button">
                  <Info size={14} />
                </button>
                <span className="layer-row__switch">
                  <input
                    aria-label={layer.label}
                    checked={layerVisibility[layer.key]}
                    onChange={(event) => onToggle(layer.key, event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span aria-hidden="true" className="layer-row__switch-track" />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="layer-controls__group">
        <legend>{messages.layerGroupBase}</legend>
        <div className="layer-controls__items">
          {BASE_LAYERS.map((layer) => (
            <label className={`layer-row ${baseMapStyle === layer.value ? "layer-row--active" : ""}`} key={layer.value}>
              <span className="layer-row__icon">
                <layer.icon size={16} />
              </span>
              <span className="layer-row__copy">
                <span className="layer-row__title">{layer.label}</span>
                <span className="layer-row__description">Base map style</span>
              </span>
              <span className="layer-row__switch layer-row__switch--radio">
                <input
                  aria-label={layer.label}
                  checked={baseMapStyle === layer.value}
                  name="base-map-style"
                  onChange={() => onBaseMapStyleChange(layer.value)}
                  type="radio"
                />
                <span aria-hidden="true" className="layer-row__radio-indicator" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
