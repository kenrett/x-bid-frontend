(function () {
  var STORAGE_KEY = "xbid-color-mode";
  var DEFAULT_MODE = "system";
  var VALID = { light: true, dark: true, system: true };

  var preference = DEFAULT_MODE;
  try {
    var stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID[stored]) {
      preference = stored;
    }
  } catch (_error) {
    preference = DEFAULT_MODE;
  }

  var isDark = false;
  try {
    isDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (_error) {
    isDark = false;
  }

  var effective =
    preference === "system" ? (isDark ? "dark" : "light") : preference;
  var root = document.documentElement;
  root.setAttribute("data-color-mode-preference", preference);
  root.setAttribute("data-color-mode", effective);
  root.style.colorScheme = effective;
})();
