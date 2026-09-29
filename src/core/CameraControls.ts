import * as THREE from 'three';

export class OrbitZoomControls {
  private camera: THREE.PerspectiveCamera;
  private dom: HTMLElement;
  private spherical = new THREE.Spherical(11, Math.PI / 2.2, 0.4);
  private target = new THREE.Vector3(0, 0, 0);
  private dragging = false;
  private prevX = 0;
  private prevY = 0;
  autoRotateEnabled = false;

  /** Clamp orbit around default frontal view (radians from frontal theta/phi) */
  orbitLimitTheta = Infinity;
  orbitLimitPhi = Infinity;
  private homeTheta = 0;
  private homePhi = Math.PI / 2;
  private homeRadius = 20;

  /** Cached ortho-poster plane for resize refit */
  private posterActive = false;
  private posterPlaneW = 9;
  private posterPlaneH = 16;
  private posterMargin = 1.06;


  /** Fired on a clear horizontal touch flick: -1 = right (prev), +1 = left (next). */
  onHorizontalFlick?: (dir: -1 | 1) => void;

  private pointerId: number | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartT = 0;
  private touchMoved = false;
  private isTouchDrag = false;
  private trackedPointers = new Set<number>();

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    this.camera = camera;
    this.dom = dom;
    this.bind();
  }


  /** Limit yaw/pitch around current home (for image-mode drag orbit without flipping). */
  setOrbitLimits(thetaDeg: number, phiDeg: number): void {
    this.orbitLimitTheta = (thetaDeg * Math.PI) / 180;
    this.orbitLimitPhi = (phiDeg * Math.PI) / 180;
    this.homeTheta = this.spherical.theta;
    this.homePhi = this.spherical.phi;
    this.homeRadius = this.spherical.radius;
  }

  clearOrbitLimits(): void {
    this.orbitLimitTheta = Infinity;
    this.orbitLimitPhi = Infinity;
  }

  private clampOrbit(): void {
    if (Number.isFinite(this.orbitLimitTheta)) {
      this.spherical.theta = Math.min(
        this.homeTheta + this.orbitLimitTheta,
        Math.max(this.homeTheta - this.orbitLimitTheta, this.spherical.theta),
      );
    }
    if (Number.isFinite(this.orbitLimitPhi)) {
      this.spherical.phi = Math.min(
        this.homePhi + this.orbitLimitPhi,
        Math.max(this.homePhi - this.orbitLimitPhi, this.spherical.phi),
      );
    }
    this.spherical.phi = Math.min(Math.PI - 0.12, Math.max(0.12, this.spherical.phi));
  }

  private bind(): void {
    this.dom.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('pointermove', this.onMove);
    this.dom.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('pointermove', this.onMove);
    this.dom.removeEventListener('wheel', this.onWheel);
  }

  private isUiTarget(el: EventTarget | null): boolean {
    const node = el as HTMLElement | null;
    return Boolean(node?.closest?.('.ui-panel, .ui-nav, .ui-toast, .ui-mode-toast'));
  }

  private onDown = (e: PointerEvent): void => {
    if (this.isUiTarget(e.target)) return;
    this.trackedPointers.add(e.pointerId);
    // Multi-touch: cancel single-finger orbit / flick (pinch/zoom stays untouched)
    if (this.trackedPointers.size > 1) {
      this.dragging = false;
      this.isTouchDrag = false;
      this.pointerId = null;
      return;
    }
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    this.isTouchDrag = e.pointerType === 'touch';
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchStartT = performance.now();
    this.touchMoved = false;
    try {
      this.dom.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  private onUp = (e: PointerEvent): void => {
    const wasTracked = this.trackedPointers.delete(e.pointerId);
    if (!wasTracked) return;

    const isPrimary = this.pointerId === e.pointerId;
    if (!isPrimary) {
      // Second finger lifted — if one remains, do not start a new orbit mid-gesture
      return;
    }

    const wasTouch = this.isTouchDrag;
    const startX = this.touchStartX;
    const startY = this.touchStartY;
    const startT = this.touchStartT;
    const wasDragging = this.dragging;

    this.dragging = false;
    this.isTouchDrag = false;
    this.pointerId = null;

    if (!wasDragging || !wasTouch || !this.onHorizontalFlick) return;
    if (this.trackedPointers.size > 0) return; // still multi-touch

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dt = performance.now() - startT;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Clear horizontal flick: primary on phones; orbit remains for slower / vertical drags.
    if (dt < 300 && absDx > 80 && absDx > absDy * 1.5) {
      this.onHorizontalFlick(dx < 0 ? 1 : -1);
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    if (this.pointerId != null && e.pointerId !== this.pointerId) return;

    const dx = e.clientX - this.prevX;
    const dy = e.clientY - this.prevY;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.touchMoved = true;
    this.spherical.theta -= dx * 0.005;
    this.spherical.phi += dy * 0.005;
    this.clampOrbit();
    this.apply();
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const minR = Number.isFinite(this.orbitLimitTheta) ? this.homeRadius * 0.75 : 2.5;
    const maxR = Number.isFinite(this.orbitLimitTheta) ? this.homeRadius * 1.45 : 32;
    this.spherical.radius = Math.min(maxR, Math.max(minR, this.spherical.radius + e.deltaY * 0.01));
    this.apply();
  };

  autoRotate(dt: number, speed = 0.08): void {
    if (this.autoRotateEnabled && !this.dragging) {
      this.spherical.theta += dt * speed;
      this.clampOrbit();
      // Ping-pong near limits for image modes
      if (Number.isFinite(this.orbitLimitTheta)) {
        if (this.spherical.theta >= this.homeTheta + this.orbitLimitTheta - 1e-3) {
          this.spherical.theta = this.homeTheta + this.orbitLimitTheta - 1e-3;
          // reverse by flipping sign of speed next time — handled by caller oscillating
        }
      }
      this.apply();
    }
  }

  /** Slow yaw for demo — returns suggested direction flip when hitting limit */
  yaw(dt: number, speed: number, dir: number): number {
    if (this.dragging) return dir;
    this.spherical.theta += dt * speed * dir;
    let next = dir;
    if (Number.isFinite(this.orbitLimitTheta)) {
      const lo = this.homeTheta - this.orbitLimitTheta;
      const hi = this.homeTheta + this.orbitLimitTheta;
      if (this.spherical.theta > hi) {
        this.spherical.theta = hi;
        next = -1;
      } else if (this.spherical.theta < lo) {
        this.spherical.theta = lo;
        next = 1;
      }
    }
    this.clampOrbit();
    this.apply();
    return next;
  }

  setWorldView(position: THREE.Vector3, target: THREE.Vector3, fov?: number): void {
    this.posterActive = false;
    this.target.copy(target);
    this.camera.position.copy(position);
    if (fov != null) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.target);
    const offset = new THREE.Vector3().subVectors(position, this.target);
    this.spherical.setFromVector3(offset);
    this.homeTheta = this.spherical.theta;
    this.homePhi = this.spherical.phi;
    this.homeRadius = this.spherical.radius;
  }

  setView(radius: number, phi: number, theta: number, target?: THREE.Vector3): void {
    this.spherical.radius = radius;
    this.spherical.phi = phi;
    this.spherical.theta = theta;
    if (target) this.target.copy(target);
    this.homeTheta = theta;
    this.homePhi = phi;
    this.homeRadius = radius;
    this.apply();
  }

  /** Front-on poster view — stores home for limited orbit */
  setOrthoPoster(planeW: number, planeH: number, margin = 1.06): void {
    this.posterActive = true;
    this.posterPlaneW = planeW;
    this.posterPlaneH = planeH;
    this.posterMargin = margin;
    this.target.set(0, 0, 0);
    const dist = 20;
    this.camera.position.set(0, 0, dist);
    this.camera.near = 0.1;
    this.camera.far = 120;
    this.applyOrthoPosterFov(dist);
    this.camera.lookAt(this.target);
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    this.spherical.setFromVector3(offset);
    this.homeTheta = this.spherical.theta;
    this.homePhi = this.spherical.phi;
    this.homeRadius = this.spherical.radius;
  }

  /** Clear poster fit (procedural modes). */
  clearOrthoPoster(): void {
    this.posterActive = false;
  }

  /**
   * Recompute poster FOV after viewport resize.
   * Wide / landscape desktop: cover (fill width — crop tall top/bottom).
   * Portrait / mobile: contain (fit full poster height).
   */
  refitOrthoPoster(): void {
    if (!this.posterActive) return;
    this.applyOrthoPosterFov(this.spherical.radius || 20);
  }

  private preferLandscapeFraming(aspect: number): boolean {
    if (aspect >= 1.12) return true;
    if (typeof window === 'undefined') return aspect >= 1;
    try {
      return window.matchMedia(
        '(min-width: 900px) and (orientation: landscape), (min-width: 1100px) and (pointer: fine)',
      ).matches;
    } catch {
      return aspect >= 1.12;
    }
  }

  private applyOrthoPosterFov(dist: number): void {
    const aspect = this.camera.aspect || 16 / 9;
    const margin = this.posterMargin;
    const halfH = (this.posterPlaneH * margin) / 2;
    const halfW = (this.posterPlaneW * margin) / 2;
    const needFovY = (2 * Math.atan(halfH / dist) * 180) / Math.PI;
    const fovFromW = (2 * Math.atan(halfW / (dist * aspect)) * 180) / Math.PI;
    // contain = max (full plane visible); cover = min (fill viewport, crop excess)
    const coverFov = Math.min(needFovY, fovFromW);
    const containFov = Math.max(needFovY, fovFromW);
    // Landscape: cover width, ease out ~8% so silhouette edges aren't flush with bezel
    const fov = this.preferLandscapeFraming(aspect)
      ? Math.min(containFov, coverFov * 1.08)
      : containFov;
    this.camera.fov = Math.min(78, Math.max(12, fov));
    this.camera.updateProjectionMatrix();
  }

  /** Set absolute spherical offset from home (degrees) — for screenshots */
  setOrbitOffset(thetaDeg: number, phiDeg = 0): void {
    this.spherical.theta = this.homeTheta + (thetaDeg * Math.PI) / 180;
    this.spherical.phi = this.homePhi + (phiDeg * Math.PI) / 180;
    this.clampOrbit();
    this.apply();
  }

  resetToHome(): void {
    this.spherical.theta = this.homeTheta;
    this.spherical.phi = this.homePhi;
    this.spherical.radius = this.homeRadius;
    this.apply();
  }

  apply(): void {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
}
