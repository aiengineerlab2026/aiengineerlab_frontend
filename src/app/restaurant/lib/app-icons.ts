import { Bot, FlaskConical, Utensils, type LucideIcon } from "lucide-react";

/** Maps the `icon` string from the backend app registry to a Lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  flask: FlaskConical,
  bot: Bot,
};

export function appIcon(name: string): LucideIcon {
  return ICONS[name] ?? FlaskConical;
}
