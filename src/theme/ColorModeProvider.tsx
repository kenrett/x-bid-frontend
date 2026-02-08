import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyColorModeToDocument,
  getColorModeLabel,
  getNextColorModePreference,
  getSystemColorMode,
  readColorModePreference,
  resolveColorMode,
  writeColorModePreference,
  type ColorModePreference,
  type ResolvedColorMode,
} from "./colorMode";

type ColorModeContextValue = {
  mode: ColorModePreference;
  effectiveMode: ResolvedColorMode;
  modeLabel: string;
  setMode: (mode: ColorModePreference) => void;
  cycleMode: () => void;
};

const defaultContextValue: ColorModeContextValue = {
  mode: "system",
  effectiveMode: getSystemColorMode(),
  modeLabel: getColorModeLabel("system"),
  setMode: () => {},
  cycleMode: () => {},
};

const ColorModeContext =
  createContext<ColorModeContextValue>(defaultContextValue);

const getInitialMode = (): ColorModePreference => {
  if (typeof document === "undefined") return "system";
  return (
    readColorModePreference() ??
    (document.documentElement.dataset.colorModePreference as
      | ColorModePreference
      | undefined) ??
    "system"
  );
};

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ColorModePreference>(getInitialMode);
  const [systemMode, setSystemMode] =
    useState<ResolvedColorMode>(getSystemColorMode);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemMode(media.matches ? "dark" : "light");

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const effectiveMode = useMemo(
    () => resolveColorMode(mode, systemMode),
    [mode, systemMode],
  );

  useEffect(() => {
    writeColorModePreference(mode);
    applyColorModeToDocument(mode);
  }, [mode, effectiveMode]);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      effectiveMode,
      modeLabel: getColorModeLabel(mode),
      setMode,
      cycleMode: () =>
        setMode((current) => getNextColorModePreference(current)),
    }),
    [mode, effectiveMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = (): ColorModeContextValue => {
  return useContext(ColorModeContext);
};
