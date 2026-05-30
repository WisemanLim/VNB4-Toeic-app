// Shared design tokens — mirrors Guardrails Admin + VNB4 frontend look-and-feel
export const colors = {
  bg: "#0f172a",       // slate-900
  bgCard: "#1e293b",   // slate-800
  bgElev: "#334155",   // slate-700
  border: "#334155",
  text: "#e2e8f0",     // slate-200
  textMuted: "#94a3b8", // slate-400
  accent: "#38bdf8",   // sky-400
  accent2: "#818cf8",  // indigo-400
  danger: "#f87171",   // red-400
  success: "#4ade80",  // green-400
  warn: "#facc15",     // yellow-400
} as const;

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  display: 32,
} as const;
