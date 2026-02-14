import * as React from "react";
import {
  LightBulbIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import {
  useThemePreference,
  type ThemePreference,
} from "../../theme/useThemePreference";

function labelFor(pref: ThemePreference) {
  switch (pref) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    case "system":
      return "System";
  }
}

export function ThemeToggleBulb() {
  const { pref, setPref } = useThemePreference();
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const Icon =
    pref === "dark"
      ? MoonIcon
      : pref === "system"
        ? ComputerDesktopIcon
        : LightBulbIcon;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label={`Theme: ${labelFor(pref)}. Change theme.`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] text-[color:var(--sf-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
        title={`Theme: ${labelFor(pref)}`}
      >
        <Icon className="h-5 w-5" />
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] shadow-lg"
        >
          <ThemeItem
            active={pref === "light"}
            icon={<LightBulbIcon className="h-5 w-5" />}
            label="Light"
            hint="Always light"
            onSelect={() => {
              setPref("light");
              setOpen(false);
            }}
          />
          <ThemeItem
            active={pref === "system"}
            icon={<ComputerDesktopIcon className="h-5 w-5" />}
            label="System"
            hint="Match device"
            onSelect={() => {
              setPref("system");
              setOpen(false);
            }}
          />
          <ThemeItem
            active={pref === "dark"}
            icon={<MoonIcon className="h-5 w-5" />}
            label="Dark"
            hint="Always dark"
            onSelect={() => {
              setPref("dark");
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ThemeItem({
  active,
  icon,
  label,
  hint,
  onSelect,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
        active
          ? "bg-black/10 text-[color:var(--sf-text)]"
          : "text-[color:var(--sf-text)] hover:bg-black/5"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--sf-border)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-5">{label}</span>
        <span className="block text-xs text-[color:var(--sf-mutedText)]">
          {hint}
        </span>
      </span>
      {active && (
        <span className="ml-auto text-xs text-[color:var(--sf-mutedText)]">
          ✓
        </span>
      )}
    </button>
  );
}
