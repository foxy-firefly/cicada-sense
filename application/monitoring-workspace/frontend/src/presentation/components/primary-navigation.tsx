import { BarChart3, Bell, Eye, LayoutGrid, Leaf, MapIcon, Radio, Settings2 } from "lucide-react";
import { messages } from "../messages.js";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: messages.monitoring },
  { icon: MapIcon, label: messages.sites },
  { icon: Radio, label: messages.sensorsNav },
  { icon: Leaf, label: messages.speciesNav },
  { icon: Bell, label: messages.alerts },
  { icon: Eye, label: messages.observationsNav },
  { icon: BarChart3, label: messages.reports },
  { icon: Settings2, label: messages.settings },
] as const;

export function PrimaryNavigation() {
  return (
    <nav aria-label={messages.primaryNavigation} className="primary-navigation">
      <ul className="primary-navigation__list">
        {NAV_ITEMS.map((item, index) => (
          <li className="primary-navigation__item" key={item.label}>
            <button
              aria-label={item.label}
              aria-pressed={index === 0}
              className="primary-navigation__button"
              title={item.label}
              type="button"
            >
              <span aria-hidden="true" className="primary-navigation__glyph">
                <item.icon size={20} />
              </span>
              <span className="sr-only">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
