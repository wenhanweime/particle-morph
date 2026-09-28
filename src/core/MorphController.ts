import { easeInOutCubic } from '../generators';
import type { ParticleLayout } from '../generators';

export class MorphController {
  private from: ParticleLayout | null = null;
  private to: ParticleLayout | null = null;
  private progress = 1;
  private duration = 1.5;
  private active = false;

  current: ParticleLayout;

  constructor(initial: ParticleLayout) {
    this.current = {
      positions: new Float32Array(initial.positions),
      colors: new Float32Array(initial.colors),
      sizes: new Float32Array(initial.sizes),
    };
  }

  get isMorphing(): boolean {
    return this.active;
  }

  start(target: ParticleLayout, duration = 1.5): void {
    this.from = {
      positions: new Float32Array(this.current.positions),
      colors: new Float32Array(this.current.colors),
      sizes: new Float32Array(this.current.sizes),
    };
    this.to = target;
    this.duration = duration;
    this.progress = 0;
    this.active = true;
  }

  /** Rebuild buffers when particle count changes */
  reset(layout: ParticleLayout): void {
    this.current = {
      positions: new Float32Array(layout.positions),
      colors: new Float32Array(layout.colors),
      sizes: new Float32Array(layout.sizes),
    };
    this.from = null;
    this.to = null;
    this.progress = 1;
    this.active = false;
  }

  update(dt: number): boolean {
    if (!this.active || !this.from || !this.to) return false;

    this.progress = Math.min(1, this.progress + dt / this.duration);
    const t = easeInOutCubic(this.progress);
    const { positions, colors, sizes } = this.current;
    const fp = this.from.positions;
    const tp = this.to.positions;
    const fc = this.from.colors;
    const tc = this.to.colors;
    const fs = this.from.sizes;
    const ts = this.to.sizes;
    const n = sizes.length;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      positions[i3] = fp[i3] + (tp[i3] - fp[i3]) * t;
      positions[i3 + 1] = fp[i3 + 1] + (tp[i3 + 1] - fp[i3 + 1]) * t;
      positions[i3 + 2] = fp[i3 + 2] + (tp[i3 + 2] - fp[i3 + 2]) * t;
      colors[i3] = fc[i3] + (tc[i3] - fc[i3]) * t;
      colors[i3 + 1] = fc[i3 + 1] + (tc[i3 + 1] - fc[i3 + 1]) * t;
      colors[i3 + 2] = fc[i3 + 2] + (tc[i3 + 2] - fc[i3 + 2]) * t;
      sizes[i] = fs[i] + (ts[i] - fs[i]) * t;
    }

    if (this.progress >= 1) {
      this.active = false;
      // Snap exactly to target
      this.current.positions.set(this.to.positions);
      this.current.colors.set(this.to.colors);
      this.current.sizes.set(this.to.sizes);
    }
    return true;
  }
}
