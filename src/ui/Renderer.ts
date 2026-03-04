/**
 * Renderer — Canvas 2D drawing for all game entities.
 *
 * Uses count-based rendering: each Flock draws min(count, MAX_VISIBLE)
 * chicken sprites clustered around the flock position. Above MAX_VISIBLE,
 * shows a count badge.
 */

import type { GameState, Flock, FoxPack, LiveObstacle, LiveGate, Particle } from '@/data/types';
import { LaneGeometry, laneX, positionToY, laneWidth } from '@/core/Lane';
import { MAX_VISIBLE_PER_FLOCK, SCREEN_SHAKE_MULTIPLIER, MUZZLE_FLASH_COOLDOWN } from '@/constants/game';
import { formatNumber } from '@/utils/format';

// ── Colors ──
const COLORS = {
    bg: '#1a1a2e',
    lane: '#2a2a3e',
    laneBorder: '#3a3a5e',
    chicken: '#fbbf24',      // warm yellow
    chickenOutline: '#d97706',
    fox: '#f97316',           // orange
    foxOutline: '#c2410c',
    gatePositive: '#22c55e',
    gateNegative: '#ef4444',
    gateFrame: '#6b7280',
    obstacle: '#a16207',
    obstacleFence: '#92400e',
    scarecrow: '#7c3aed',
    fort: '#dc2626',
    fortDamaged: '#991b1b',
    cannon: '#8b5cf6',
    cannonBase: '#6d28d9',
    aimLine: 'rgba(251, 191, 36, 0.4)',
    hud: '#e5e7eb',
    hudBg: 'rgba(0, 0, 0, 0.5)',
    corn: '#fbbf24',
    feather: '#fcd34d',
    fortHpBar: '#ef4444',
    fortHpBg: '#374151',
} as const;

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;

    constructor(private readonly canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D context not supported. Please use a modern browser.');
        }
        this.ctx = ctx;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize(): void {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Reset transform to prevent cumulative scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.width = rect.width * dpr;
        this.height = rect.height * dpr;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.scale(dpr, dpr);
        // Store logical dimensions
        this.width = rect.width;
        this.height = rect.height;
    }

    getWidth(): number { return this.width; }
    getHeight(): number { return this.height; }

    render(state: GameState, geo: LaneGeometry): void {
        const ctx = this.ctx;
        const now = Date.now();

        // Apply screen shake
        ctx.save();
        if (state.screenShake > 0) {
            const intensity = state.screenShake * SCREEN_SHAKE_MULTIPLIER;
            ctx.translate(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity,
            );
        }

        // ── Background ──
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // ── Lanes ──
        this.drawLanes(geo);

        // ── Gates ──
        for (const gate of state.gates) {
            this.drawGate(gate, geo, now);
        }

        // ── Obstacles ──
        for (const obs of state.obstacles) {
            if (obs.alive) this.drawObstacle(obs, geo);
        }

        // ── Fort ──
        this.drawFort(state, geo);

        // ── Flocks ──
        for (const flock of state.flocks) {
            if (flock.alive && flock.count > 0) {
                this.drawFlock(flock, geo);
            }
        }

        // ── Fox Packs ──
        for (const fox of state.foxPacks) {
            if (fox.alive && fox.count > 0) {
                this.drawFoxPack(fox, geo);
            }
        }

        // ── Particles ──
        this.drawParticles(state.particles);

        // ── Cannon ──
        this.drawCannon(state, geo);

        // ── HUD ──
        this.drawHUD(state, geo);

        ctx.restore();

        // ── Victory flash overlay ──
        if (state.victoryFlash > 0) {
            const gradient = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, this.width
            );
            gradient.addColorStop(0, `rgba(251, 191, 36, ${state.victoryFlash * 0.4})`);
            gradient.addColorStop(0.5, `rgba(251, 191, 36, ${state.victoryFlash * 0.2})`);
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // ── End-of-level summary (drawn AFTER ctx.restore to avoid screen shake) ──
        if (state.levelComplete && state.levelSummary) {
            this.drawLevelSummary(state);
        }
    }

    private drawLanes(geo: LaneGeometry): void {
        const ctx = this.ctx;
        const w = laneWidth(geo);

        for (let i = 0; i < geo.count; i++) {
            const x = w * i;
            const y = geo.topMargin;
            const h = this.height - geo.topMargin - geo.bottomMargin;

            // Lane fill
            ctx.fillStyle = COLORS.lane;
            ctx.fillRect(x + 4, y, w - 8, h);

            // Lane borders
            ctx.strokeStyle = COLORS.laneBorder;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y, w - 8, h);
        }
    }

    private drawGate(gate: LiveGate, geo: LaneGeometry, now: number): void {
        const ctx = this.ctx;
        const def = gate.definition;
        // Use x property for horizontal position, fallback to lane center
        const x = def.x !== undefined ? def.x * this.width : laneX(geo, def.lane);
        const y = positionToY(geo, def.position);
        // Use actual collision width from gate definition
        const w = (def.width ?? 0.08) * this.width;
        const h = 28;

        // Check if gate is visible (within canvas bounds)
        const isVisible = y > -h && y < this.height + h && x > -w && x < this.width + w;
        if (!isVisible) return;

        // Pulsing glow effect for untriggered gates
        if (!gate.triggered) {
            const pulse = Math.sin(now / 300) * 0.3 + 0.7; // 0.4-1.0 range
            const glowRadius = w * 1.5;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            gradient.addColorStop(0, `rgba(${def.isPositive ? '34,197,94' : '239,68,68'}, ${pulse * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${def.isPositive ? '34,197,94' : '239,68,68'}, ${pulse * 0.15})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
        }

        // Gate body
        ctx.fillStyle = def.isPositive ? COLORS.gatePositive : COLORS.gateNegative;
        ctx.globalAlpha = 0.85;

        // Rounded rect
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + radius, y - h / 2);
        ctx.lineTo(x + w / 2 - radius, y - h / 2);
        ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + radius);
        ctx.lineTo(x + w / 2, y + h / 2 - radius);
        ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - radius, y + h / 2);
        ctx.lineTo(x - w / 2 + radius, y + h / 2);
        ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - radius);
        ctx.lineTo(x - w / 2, y - h / 2 + radius);
        ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + radius, y - h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1.0;

        // Gate frame
        ctx.strokeStyle = COLORS.gateFrame;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        const label = def.isPositive
            ? `×${def.multiplier}`
            : def.multiplier === 0 ? '☠' : `×${def.multiplier}`;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);

        // Icon indicator (colorblind-friendly)
        if (def.isPositive) {
            ctx.fillText('▲', x + w / 2 - 12, y);
        } else {
            ctx.fillText('▼', x + w / 2 - 12, y);
        }
    }

    private drawFlock(flock: Flock, geo: LaneGeometry): void {
        const ctx = this.ctx;
        // Use x property for horizontal position, fallback to lane center
        const x = flock.x !== undefined ? flock.x * this.width : laneX(geo, flock.lane);
        const cx = x;
        const cy = positionToY(geo, flock.position);
        const count = Math.min(flock.count, MAX_VISIBLE_PER_FLOCK);
        const r = 5;

        // Draw chicken sprites as circles in a cluster
        for (let i = 0; i < count; i++) {
            // Deterministic spread based on index
            const angle = (i / count) * Math.PI * 2 + i * 0.5;
            const dist = Math.sqrt(i + 1) * 4;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist * 0.5;

            ctx.fillStyle = COLORS.chicken;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = COLORS.chickenOutline;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Tiny beak
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(cx + dx + r, cy + dy);
            ctx.lineTo(cx + dx + r + 3, cy + dy - 1);
            ctx.lineTo(cx + dx + r + 3, cy + dy + 1);
            ctx.closePath();
            ctx.fill();
        }

        // Count badge if more than MAX_VISIBLE
        if (flock.count > MAX_VISIBLE_PER_FLOCK) {
            this.drawBadge(cx, cy - 20, flock.count.toString());
        } else if (flock.count > 1) {
            this.drawBadge(cx, cy - 15, flock.count.toString());
        }
    }

    private drawFoxPack(fox: FoxPack, geo: LaneGeometry): void {
        const ctx = this.ctx;
        // Use x property for horizontal position, fallback to lane center
        const x = fox.x !== undefined ? fox.x * this.width : laneX(geo, fox.lane);
        const cx = x;
        const cy = positionToY(geo, fox.position);
        const count = Math.min(fox.count, MAX_VISIBLE_PER_FLOCK);
        const r = 6;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + i * 0.7;
            const dist = Math.sqrt(i + 1) * 5;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist * 0.5;

            // Fox body (triangle-ish)
            ctx.fillStyle = COLORS.fox;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = COLORS.foxOutline;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Fox ears
            ctx.fillStyle = COLORS.foxOutline;
            ctx.beginPath();
            ctx.moveTo(cx + dx - 3, cy + dy - r);
            ctx.lineTo(cx + dx - 1, cy + dy - r - 5);
            ctx.lineTo(cx + dx + 1, cy + dy - r);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + dx + 1, cy + dy - r);
            ctx.lineTo(cx + dx + 3, cy + dy - r - 5);
            ctx.lineTo(cx + dx + 5, cy + dy - r);
            ctx.closePath();
            ctx.fill();
        }

        if (fox.count > 1) {
            this.drawBadge(cx, cy - 18, fox.count.toString());
        }
    }

    private drawObstacle(obs: LiveObstacle, geo: LaneGeometry): void {
        const ctx = this.ctx;
        const def = obs.definition;
        // Use x property for horizontal position, fallback to lane center
        const x = def.x !== undefined ? def.x * this.width : laneX(geo, def.lane);
        const cx = x;
        const cy = positionToY(geo, def.position);

        if (def.type === 'fence') {
            ctx.fillStyle = COLORS.obstacleFence;
            ctx.fillRect(cx - 25, cy - 6, 50, 12);
            ctx.strokeStyle = '#713f12';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - 25, cy - 6, 50, 12);
            // HP text
            if (obs.currentHp < Infinity) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.ceil(obs.currentHp)} HP`, cx, cy);
            }
        } else if (def.type === 'hay_bale') {
            ctx.fillStyle = COLORS.obstacle;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.stroke();
            // HP text
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.ceil(obs.currentHp)}`, cx, cy);
        } else if (def.type === 'scarecrow') {
            // Rotating scarecrow
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(obs.phase);
            ctx.fillStyle = COLORS.scarecrow;
            ctx.fillRect(-20, -3, 40, 6); // arm
            ctx.fillRect(-3, -15, 6, 30); // body
            ctx.restore();
            // Head
            ctx.fillStyle = COLORS.scarecrow;
            ctx.beginPath();
            ctx.arc(cx, cy - 15, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawFort(state: GameState, geo: LaneGeometry): void {
        const ctx = this.ctx;
        const fort = state.fort;
        const y = geo.topMargin;
        const w = this.width * 0.6;
        const h = geo.topMargin * 0.7;
        const x = (this.width - w) / 2;

        // Fort body
        const hpRatio = Math.max(0, fort.currentHp / fort.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? COLORS.fort : COLORS.fortDamaged;
        ctx.fillRect(x, y - h, w, h);

        // Fort battlements
        const bw = w / 8;
        for (let i = 0; i < 8; i += 2) {
            ctx.fillRect(x + i * bw, y - h - 10, bw, 10);
        }

        // Fort HP bar
        const barY = y - h - 20;
        const barW = w * 0.8;
        const barX = x + (w - barW) / 2;
        ctx.fillStyle = COLORS.fortHpBg;
        ctx.fillRect(barX, barY, barW, 8);
        ctx.fillStyle = COLORS.fortHpBar;
        ctx.fillRect(barX, barY, barW * hpRatio, 8);

        // Fort label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦊 FOX FORT', this.width / 2, y - h / 2);
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.ceil(fort.currentHp)} / ${fort.maxHp}`, this.width / 2, y - h / 2 + 14);
    }

    private drawCannon(state: GameState, geo: LaneGeometry): void {
        const ctx = this.ctx;
        const cx = (state.cannonX ?? 0.5) * this.width;
        const cy = this.height - geo.bottomMargin / 2;
        const r = 22;

        // Cannon base
        ctx.fillStyle = COLORS.cannonBase;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fill();

        // Cannon body
        ctx.fillStyle = COLORS.cannon;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle flash / shockwave effect when firing
        if (state.isFiring && state.cannonCooldown > MUZZLE_FLASH_COOLDOWN) {
            // Outer shockwave ring
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
            ctx.stroke();

            // Inner flash burst
            const flashGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8);
            flashGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            flashGradient.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)');
            flashGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = flashGradient;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aim line (vertical, straight up)
        if (state.isFiring) {
            const aimLen = 120;
            ctx.strokeStyle = COLORS.aimLine;
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy - aimLen);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Cannon emoji
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏚️', cx, cy);

        // Fire indicator
        if (state.isFiring) {
            ctx.strokeStyle = COLORS.chicken;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    private drawHUD(state: GameState, _geo: LaneGeometry): void {
        const ctx = this.ctx;

        // ── Left side: Level name ──
        ctx.fillStyle = COLORS.hud;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Lv. ${state.level.name}`, 10, 8);

        // ── Right side: Score display ──
        ctx.textAlign = 'right';
        
        // Use shared formatter
        // (Keep small inline helper for legacy if needed)

        // Chickens reached fort (converted to corn)
        ctx.fillStyle = COLORS.corn;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`🐔 ${formatNumber(state.totalChickensReachedFort)}`, this.width - 10, 8);

        // Efficiency percentage
        const efficiency = state.totalChickensFired > 0 
            ? Math.round((state.totalChickensReachedFort / state.totalChickensFired) * 100)
            : 0;
        ctx.fillStyle = efficiency >= 50 ? '#22c55e' : '#ef4444';
        ctx.font = '12px monospace';
        ctx.fillText(`${efficiency}%`, this.width - 10, 24);

        // Chickens on field
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px monospace';
        ctx.fillText(`Field: ${formatNumber(state.currentChickensOnField)}`, this.width - 10, 40);
    }

    private drawLevelSummary(state: GameState): void {
        const ctx = this.ctx;
        const s = state.levelSummary!;
        
        const boxW = Math.min(280, this.width - 20);
        const boxH = 220;
        const boxX = (this.width - boxW) / 2;
        const boxY = (this.height - boxH) / 2 - 30;
        
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        // Border
        ctx.strokeStyle = s.won ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        // Title
        ctx.fillStyle = s.won ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.won ? 'LEVEL COMPLETE' : 'LEVEL FAILED', this.width / 2, boxY + 30);
        
        // Stars
        if (s.won) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '24px monospace';
            ctx.fillText('★'.repeat(s.stars), this.width / 2, boxY + 60);
        }
        
        // Stats
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        const statsX = boxX + 20;
        let statsY = boxY + 90;

        ctx.fillText(`Deployed:  ${formatNumber(s.deployed)}`, statsX, statsY);
        ctx.fillText(`Reached:   ${formatNumber(s.reachedFort)}`, statsX, statsY + 22);
        ctx.fillText(`On Field:  ${formatNumber(s.currentlyOnField)}`, statsX, statsY + 44);
        ctx.fillText(`Lost:      ${formatNumber(s.destroyed)}`, statsX, statsY + 66);
        
        // Efficiency bar
        const barW = boxW - 40;
        const barH = 16;
        const barX = statsX;
        const barY = statsY + 90;
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(barX, barY, barW, barH);
        
        const effPercent = Math.round(s.efficiency * 100);
        const effColor = effPercent >= 80 ? '#22c55e' : effPercent >= 50 ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = effColor;
        ctx.fillRect(barX, barY, barW * s.efficiency, barH);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${effPercent}% Efficiency`, boxX + boxW / 2, barY + 12);
        
        // Time
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px monospace';
        ctx.fillText(`Time: ${s.timeElapsed.toFixed(1)}s`, boxX + boxW / 2, boxY + boxH - 15);
        
        // Continue prompt
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px monospace';
        ctx.fillText('Tap to continue', boxX + boxW / 2, boxY + boxH - 2);
    }

    private drawParticles(particles: Particle[]): void {
        const ctx = this.ctx;
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            
            if (p.type === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation ?? 0);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    }

    private drawBadge(x: number, y: number, text: string): void {
        const ctx = this.ctx;
        const w = ctx.measureText(text).width + 10;
        ctx.fillStyle = COLORS.hudBg;

        // Rounded pill
        const h = 16;
        const r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + r, y - h / 2);
        ctx.lineTo(x + w / 2 - r, y - h / 2);
        ctx.arc(x + w / 2 - r, y, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(x - w / 2 + r, y + h / 2);
        ctx.arc(x - w / 2 + r, y, r, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    clear(): void {
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}
