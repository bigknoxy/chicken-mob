export const COLORS = {
    primary: '#fbbf24', secondary: '#8b5cf6', danger: '#ef4444', success: '#22c55e',
    bgDark: '#1a1a2e', bgMid: '#16213e', bgLight: '#0f3460',
    uiSurface: 'rgba(30, 41, 59, 0.95)', uiBorder: '#475569', uiText: '#f1f5f9', uiMuted: '#94a3b8',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const RADIUS = { sm: 6, md: 10, lg: 16 } as const;
export const SHADOWS = { sm: '0 2px 4px rgba(0,0,0,0.3)', md: '0 4px 12px rgba(0,0,0,0.4)', glow: '0 0 20px rgba(251, 191, 36, 0.4)' } as const;
export const TRANSITIONS = { fast: '0.1s ease', normal: '0.2s ease', smooth: '0.3s cubic-bezier(0.16, 1, 0.3, 1)' } as const;
