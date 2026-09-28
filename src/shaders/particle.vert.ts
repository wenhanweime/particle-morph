export const particleVert = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;

uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uTime;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mvPosition.z, 0.5);

  float depthFade = clamp(18.0 / dist, 0.6, 1.3);
  // Mild size variance feel via subtle twinkle (still sharp dots)
  float twinkle = 0.92 + 0.08 * sin(uTime * 1.15 + position.x * 3.2 + position.z * 2.1);
  float size = aSize * uSizeScale * twinkle * depthFade * uPixelRatio * (42.0 / dist);
  // Cap keeps points tiny — never fat sprites
  gl_PointSize = clamp(size, 0.5, 4.8);

  vAlpha = clamp(1.12 - dist * 0.01, 0.35, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;
