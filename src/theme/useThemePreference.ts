import { useColorMode } from "./ColorModeProvider";
import type { ColorModePreference } from "./colorMode";

export type ThemePreference = ColorModePreference;

export const useThemePreference = (): {
  pref: ThemePreference;
  setPref: (preference: ThemePreference) => void;
} => {
  const { mode, setMode } = useColorMode();
  return {
    pref: mode,
    setPref: setMode,
  };
};
