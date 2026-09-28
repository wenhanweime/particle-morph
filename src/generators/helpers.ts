export function hash(i: number): number {
  let x = Math.imul(i ^ 0x27d4eb2d, 0x165667b1);
  x = Math.imul(x ^ (x >>> 15), 0x27d4eb2d);
  x = Math.imul(x ^ (x >>> 13), 0x165667b1);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export function hash2(i: number, salt: number): number {
  return hash(i * 374761393 + salt * 668265263);
}

export function gaussian(u1: number, u2: number): number {
  const r = Math.sqrt(-2 * Math.log(Math.max(1e-9, u1)));
  return r * Math.cos(2 * Math.PI * u2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): [number, number, number] {
  return [lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)];
}

export function setParticle(
  positions: Float32Array,
  colors: Float32Array,
  sizes: Float32Array,
  i: number,
  x: number, y: number, z: number,
  r: number, g: number, b: number,
  size: number,
): void {
  const i3 = i * 3;
  positions[i3] = x;
  positions[i3 + 1] = y;
  positions[i3 + 2] = z;
  colors[i3] = r;
  colors[i3 + 1] = g;
  colors[i3 + 2] = b;
  sizes[i] = size;
}

export function createEmptyLayout(count: number) {
  return {
    positions: new Float32Array(count * 3),
    colors: new Float32Array(count * 3),
    sizes: new Float32Array(count),
  };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Cheap value noise 1D */
export function vnoise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i * 1103515245);
  const b = hash((i + 1) * 1103515245);
  return a + (b - a) * u;
}
