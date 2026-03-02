
export const theme = {
  colors: {
    bg: "#2e4057",    
    accentPrimary: "#eca72c",
    accentWarning: "#ff9e4a",
    // Used for UI highlight states (accordions, active chips, etc.)
    accentHighlight: "#2096df",
    accentHighlightBg: withAlpha("#5c87b2", 0.07),
    accentHighlightBorder: withAlpha("#75abe1", 0.22),
    text: "#ffffff",
    textDark: "#000000",
    muted: "rgba(255,255,255,0.72)",
    panelBg: "rgba(255,255,255,0.06)",
    panelBorder: "rgba(255,255,255,0.14)",
    inputBg: "rgba(0,0,0,0.25)",
    // Overlay / chrome
    scrim: "rgba(0,0,0,0.62)",
    shadowColor: "rgba(0,0,0,0.62)",
    drawerBg: "rgba(46, 64, 87, 0.96)",
    modalBg: "rgba(46, 64, 87, 0.96)",
    red: "#ff5d5d",
    bloody: "#ff9e4a",
    green: "#7dc56d",
    // Combat list defaults (eventually user-editable like Shield Maiden)
    blue: "#4aa3ff",
  },
  radius: { panel: 14, control: 10 },
  // Default spacing is compact; small-screen overrides happen via CSS where possible.
  spacing: { pagePad: 10, gap: 6 }
};

// Utility for creating translucent UI colors from theme tokens.
// Keeps highlight tweaks centralized and avoids scattering hardcoded rgba/hex math.
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const c = (color || "").trim();

  // rgba(r,g,b,a) -> swap alpha
  const rgbaMatch = c.match(/^rgba\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*),(\s*[\d.]+\s*)\)$/i);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${a})`;
  }

  // rgb(r,g,b) -> rgba
  const rgbMatch = c.match(/^rgb\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)\)$/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${a})`;
  }

  // #rgb / #rrggbb
  const hex = c.startsWith("#") ? c.slice(1) : c;
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // Fallback: return original (can't apply alpha safely)
  return c;
}
