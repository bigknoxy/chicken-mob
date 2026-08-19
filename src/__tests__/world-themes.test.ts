import { describe, it, expect } from 'vitest';
import { WORLDS } from '@/data/levels';
import { WORLD_THEMES, getThemePalette, type ThemePalette } from '@/constants/game';
import type { WorldTheme } from '@/data/types';

// ── P0-4: world-theme duplication ──
// Every world must resolve to a visually-distinct palette so that progression
// between worlds is legible. Regression guard for the F3 finding.

function paletteSig(p: ThemePalette): string {
    return [p.bg, p.bgAccent, p.lane, p.laneBorder, p.fog].join('|');
}

describe('World Theme Distinctness', () => {
    it('all six worlds declare six unique theme tokens', () => {
        const themes = WORLDS.map(w => w.theme);
        expect(new Set(themes).size).toBe(themes.length);
        expect(WORLDS.length).toBe(6);
        expect(new Set(WORLDS.map(w => w.name)).size).toBe(WORLDS.length);
     });

    it('each world resolves to a unique palette (no two worlds look identical)', () => {
        const sigs = WORLDS.map(w => {
            const theme = w.theme;
            expect(WORLD_THEMES[theme as WorldTheme], `theme "${theme}" must have a palette`).toBeTruthy();
            return paletteSig(getThemePalette(theme));
         });
        expect(new Set(sigs).size).toBe(sigs.length);
     });

    it('getThemePalette falls back to grassland for unknown themes', () => {
        expect(getThemePalette('does-not-exist')).toStrictEqual(WORLD_THEMES.grassland);
     });
});
