"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const triggerClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted";
const popupClass =
  "max-h-64 min-w-40 overflow-y-auto rounded-xl bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10";
const itemClass =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 data-[highlighted]:bg-muted";

// Shared pill-trigger + Base UI Menu dropdown — the style Library's own
// Sort control originated (rounded-full pill, checkmark on the active
// option inside the menu) rather than a native <select>'s plain bordered
// box. Was previously only on Library; Compare's sort and Search's Genre/
// Rating/Published filters used a native <select> instead, which read as
// an inconsistent second pattern for the exact same "pick one of these
// options" interaction. Unlike Library's original inline Sort button
// (which always showed the fixed word "Sort"), this shows the *current*
// selection as the trigger label — matches what a native <select> already
// showed, so switching to this style is a pure visual upgrade, not a
// usability regression.
export function DropdownSelect({
  value,
  options,
  onChange,
  icon: Icon = ChevronDown,
  triggerClassName,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  triggerClassName?: string;
}) {
  const current = options.find((option) => option.value === value);

  return (
    <Menu.Root>
      <Menu.Trigger className={cn(triggerClass, triggerClassName)}>
        <Icon className="size-3.5" />
        {current?.label ?? options[0]?.label}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className={popupClass}>
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                onClick={() => onChange(option.value)}
                className={itemClass}
              >
                {option.label}
                {option.value === value && <Check className="size-3.5" />}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
