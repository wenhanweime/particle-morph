export const particleFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  // Keep hard-ish disc; tiny soft rim only (no fat bokeh)
  if (d > 0.5) discard;
  float core = 1.0 - smoothstep(0.0, 0.32, d);
  float rim = exp(-d * 28.0) * 0.08;
  float alpha = core * core * 1.15 + rim;
  // Boost luminance so overlapping additive points form continuous cores
  vec3 col = vColor * (0.95 + core * 0.55);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * vAlpha);
}
`;
