export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "openwish-theme";

// Inlined into <head> so the right theme is on <html> before first paint. Kept as a
// literal string (not Function#toString) so server and client render the same markup.
// Mirrors applyTheme below.
export const THEME_INIT_SCRIPT = `(function(){var m=matchMedia("(prefers-color-scheme: dark)");function a(){var p=null;try{p=localStorage.getItem("${STORAGE_KEY}")}catch(e){}var d=p==="dark"||(p!=="light"&&m.matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}a();m.addEventListener("change",a)})()`;

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {}
  return "system";
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
  applyTheme(preference);
}
