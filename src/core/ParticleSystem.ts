import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { particleVert } from '../shaders/particle.vert';
import { particleFrag } from '../shaders/particle.frag';
import { MorphController } from './MorphController';
import { OrbitZoomControls } from './CameraControls';
import {
  generateLayout,
  QUALITY_COUNTS,
  MODES,
  CAMERA_PRESETS,
  isImageMode,
  getLayoutMeta,
  type ModeId,
  type QualityLevel,
  type ParticleLayout,
} from '../generators';

export class ParticleSystem {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitZoomControls;

  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private morph: MorphController;
  private posAttr: THREE.BufferAttribute;
  private colAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;

  private mode: ModeId = 'pinDarkVortex';
  private quality: QualityLevel = 'med';
  private count: number;
  private layoutCache = new Map<string, ParticleLayout>();
  private clock = new THREE.Clock();
  private autoDemo = false;
  private autoTimer = 0;
  private autoInterval = 5;
  private group = new THREE.Group();
  private voidMesh: THREE.Mesh;
  private spinY = 0;
  private yawDir = 1;
  private imageMode = false;

  onModeChange?: (mode: ModeId) => void;

  constructor(container: HTMLElement) {
    this.count = QUALITY_COUNTS[this.quality];

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.05,
      250,
    );

    this.controls = new OrbitZoomControls(this.camera, this.renderer.domElement);

    const initial = this.getLayout(this.mode);
    this.morph = new MorphController(initial);

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.morph.current.positions, 3);
    this.colAttr = new THREE.BufferAttribute(this.morph.current.colors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.morph.current.sizes, 1);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aColor', this.colAttr);
    this.geometry.setAttribute('aSize', this.sizeAttr);

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSizeScale: { value: 1.0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);

    const voidR = Math.max(0.01, CAMERA_PRESETS.blackHole.voidRadius ?? 0);
    this.voidMesh = new THREE.Mesh(
      new THREE.SphereGeometry(voidR, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    this.voidMesh.visible = false;
    this.group.add(this.voidMesh);
    this.scene.add(this.group);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.12,
      0.25,
      0.9,
    );
    this.composer.addPass(this.bloomPass);

    this.applyPreset(this.mode);
    window.addEventListener('resize', this.onResize);
  }

  get currentMode(): ModeId {
    return this.mode;
  }

  get currentQuality(): QualityLevel {
    return this.quality;
  }

  get isAutoDemo(): boolean {
    return this.autoDemo;
  }

  private cacheKey(mode: ModeId): string {
    return `${mode}:${this.count}`;
  }

  private getLayout(mode: ModeId): ParticleLayout {
    const key = this.cacheKey(mode);
    let layout = this.layoutCache.get(key);
    if (!layout) {
      layout = generateLayout(mode, this.count);
      this.layoutCache.set(key, layout);
    }
    return layout;
  }

  setMode(mode: ModeId, instant = false): void {
    if (mode === this.mode && !instant) return;
    this.mode = mode;
    const target = this.getLayout(mode);
    if (instant) {
      this.morph.reset(target);
      this.syncAttributes(true);
    } else {
      this.morph.start(target, 1.5);
    }
    this.applyPreset(mode);
    this.autoTimer = 0;
    this.onModeChange?.(mode);
  }

  private applyPreset(mode: ModeId): void {
    const p = CAMERA_PRESETS[mode];
    const vr = CAMERA_PRESETS[mode].voidRadius ?? 0;
    this.voidMesh.visible = mode === 'blackHole' && vr > 0.1;
    this.group.rotation.set(0, 0, 0);
    this.spinY = p.spinY;
    this.bloomPass.strength = p.bloom[0];
    this.bloomPass.radius = p.bloom[1];
    this.bloomPass.threshold = p.bloom[2];

    this.imageMode = isImageMode(mode);
    if (this.imageMode) {
      const meta = getLayoutMeta(mode);
      const pw = meta?.planeW ?? 9;
      const ph = meta?.planeH ?? 19.55;
      this.controls.setOrthoPoster(pw, ph, 1.02);
      // Allow ±32° yaw / ±18° pitch for parallax without losing silhouette
      this.controls.setOrbitLimits(36, 22);
      this.material.uniforms.uSizeScale.value =
        this.quality === 'low' ? 1.65 : this.quality === 'high' ? 1.28 : 1.48;
      this.spinY = 0;
      this.yawDir = 1;
      // Slow yaw only during auto-demo
      this.controls.autoRotateEnabled = false;
    } else {
      this.controls.clearOrbitLimits();
      const pos = new THREE.Vector3(...p.position);
      const target = new THREE.Vector3(...p.target);
      this.controls.setWorldView(pos, target, p.fov);
      this.controls.autoRotateEnabled = this.autoDemo;
    }
  }

  /** For screenshots / debug: offset orbit from frontal home */
  setOrbitOffset(thetaDeg: number, phiDeg = 0): void {
    this.controls.setOrbitOffset(thetaDeg, phiDeg);
  }

  resetOrbit(): void {
    this.controls.resetToHome();
  }

  setQuality(q: QualityLevel): void {
    if (q === this.quality) return;
    this.quality = q;
    this.count = QUALITY_COUNTS[q];
    this.layoutCache.clear();

    const layout = this.getLayout(this.mode);
    this.morph.reset(layout);

    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.morph.current.positions, 3);
    this.colAttr = new THREE.BufferAttribute(this.morph.current.colors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.morph.current.sizes, 1);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aColor', this.colAttr);
    this.geometry.setAttribute('aSize', this.sizeAttr);
    this.points.geometry = this.geometry;

    if (this.imageMode) {
      this.material.uniforms.uSizeScale.value =
        q === 'low' ? 1.65 : q === 'high' ? 1.28 : 1.48;
    } else {
      this.material.uniforms.uSizeScale.value = q === 'low' ? 1.15 : q === 'high' ? 0.95 : 1.0;
    }
  }

  setAutoDemo(on: boolean): void {
    this.autoDemo = on;
    this.autoTimer = 0;
    // Image modes use ping-pong yaw in the loop; procedural uses spherical autoRotate
    this.controls.autoRotateEnabled = on && !this.imageMode;
  }

  setBloom(strength: number): void {
    this.bloomPass.strength = strength;
  }

  nextMode(): void {
    const idx = MODES.findIndex((m) => m.id === this.mode);
    const next = MODES[(idx + 1) % MODES.length];
    this.setMode(next.id);
  }

  prevMode(): void {
    const idx = MODES.findIndex((m) => m.id === this.mode);
    const prev = MODES[(idx - 1 + MODES.length) % MODES.length];
    this.setMode(prev.id);
  }

  /** Brief bloom kick on mode switch — lightweight feedback, no shader churn. */
  pulse(extra = 0.32): void {
    const base = this.bloomPass.strength;
    const peak = Math.min(base + extra, 1.35);
    this.bloomPass.strength = peak;
    const sizeBase = this.material.uniforms.uSizeScale.value as number;
    this.material.uniforms.uSizeScale.value = sizeBase * 1.08;
    const start = performance.now();
    const dur = 320;
    const tick = (): void => {
      const t = Math.min(1, (performance.now() - start) / dur);
      const ease = 1 - (1 - t) * (1 - t);
      this.bloomPass.strength = peak + (base - peak) * ease;
      this.material.uniforms.uSizeScale.value = sizeBase * (1.08 + (1 - 1.08) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.bloomPass.strength = base;
        this.material.uniforms.uSizeScale.value = sizeBase;
      }
    };
    requestAnimationFrame(tick);
  }

  private syncAttributes(full = false): void {
    (this.posAttr.array as Float32Array).set(this.morph.current.positions);
    (this.colAttr.array as Float32Array).set(this.morph.current.colors);
    (this.sizeAttr.array as Float32Array).set(this.morph.current.sizes);
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    if (full) this.geometry.computeBoundingSphere();
  }

  private onResize = (): void => {
    const w = this.renderer.domElement.parentElement?.clientWidth ?? window.innerWidth;
    const h = this.renderer.domElement.parentElement?.clientHeight ?? window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  };

  start(): void {
    const loop = (): void => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;

      this.material.uniforms.uTime.value = t;

      if (this.spinY !== 0) {
        this.group.rotation.y += dt * this.spinY;
      }

      if (this.imageMode && this.autoDemo) {
        this.yawDir = this.controls.yaw(dt, 0.22, this.yawDir);
      } else {
        this.controls.autoRotate(dt, this.autoDemo ? 0.08 : 0);
      }

      if (this.controls.forceStrength > 0.05 && !this.morph.isMorphing) {
        this.applyPointerForce(dt);
      }

      if (this.morph.update(dt)) {
        this.syncAttributes();
      }

      if (this.autoDemo) {
        this.autoTimer += dt;
        if (this.autoTimer >= this.autoInterval) {
          this.autoTimer = 0;
          this.nextMode();
        }
      }

      this.composer.render();
    };
    loop();
  }

  private applyPointerForce(dt: number): void {
    const strength = this.controls.forceStrength * 2.0 * dt;
    const ndc = this.controls.pointerNDC;
    const positions = this.morph.current.positions;
    const n = this.count;
    const step = Math.max(1, Math.floor(n / 8000));
    for (let i = 0; i < n; i += step) {
      const i3 = i * 3;
      const px = positions[i3] * 0.12;
      const py = positions[i3 + 1] * 0.12;
      const dx = ndc.x - px;
      const dy = ndc.y - py;
      const dist2 = dx * dx + dy * dy + 0.05;
      const f = strength / dist2;
      positions[i3] += dx * f * 0.12;
      positions[i3 + 1] += dy * f * 0.12;
    }
    (this.posAttr.array as Float32Array).set(positions);
    this.posAttr.needsUpdate = true;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
