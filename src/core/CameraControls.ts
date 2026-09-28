import * as THREE from 'three';

export class OrbitZoomControls {
  private camera: THREE.PerspectiveCamera;
  private dom: HTMLElement;
  private spherical = new THREE.Spherical(11, Math.PI / 2.2, 0.4);
  private target = new THREE.Vector3(0, 0, 0);
  private dragging = false;
  private prevX = 0;
  private prevY = 0;
  private enabledForce = true;
  autoRotateEnabled = false;

  /** Clamp orbit around default frontal view (radians from frontal theta/phi) */
  orbitLimitTheta = Infinity;
  orbitLimitPhi = Infinity;
  private homeTheta = 0;
  private homePhi = Math.PI / 2;
  private homeRadius = 20;

  readonly pointerNDC = new THREE.Vector2(0, 0);
  forceStrength = 0;

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    this.camera = camera;
    this.dom = dom;
    this.bind();
  }

  setForceEnabled(on: boolean): void {
    this.enabledForce = on;
  }

  /** Limit yaw/pitch around current home (for image-mode parallax without flipping). */
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
    window.addEventListener('pointermove', this.onMove);
    this.dom.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointermove', this.onMove);
    this.dom.removeEventListener('wheel', this.onWheel);
  }

  private onDown = (e: PointerEvent): void => {
    if ((e.target as HTMLElement).closest?.('.ui-panel')) return;
    this.dragging = true;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
  };

  private onUp = (): void => {
    this.dragging = false;
  };

  private onMove = (e: PointerEvent): void => {
    const rect = this.dom.getBoundingClientRect();
    this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (this.enabledForce && !this.dragging) {
      this.forceStrength = 1;
    }

    if (!this.dragging) return;
    const dx = e.clientX - this.prevX;
    const dy = e.clientY - this.prevY;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
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
    this.forceStrength *= 0.96;
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
    this.target.set(0, 0, 0);
    const dist = 20;
    this.camera.position.set(0, 0, dist);
    this.camera.near = 0.1;
    this.camera.far = 120;
    const aspect = this.camera.aspect || 9 / 16;
    const halfH = (planeH * margin) / 2;
    const halfW = (planeW * margin) / 2;
    const needFovY = (2 * Math.atan(halfH / dist) * 180) / Math.PI;
    const fovFromW = (2 * Math.atan(halfW / (dist * aspect)) * 180) / Math.PI;
    this.camera.fov = Math.max(needFovY, fovFromW);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.target);
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    this.spherical.setFromVector3(offset);
    this.homeTheta = this.spherical.theta;
    this.homePhi = this.spherical.phi;
    this.homeRadius = this.spherical.radius;
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
