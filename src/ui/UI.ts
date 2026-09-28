import { MODES, type ModeId, type QualityLevel } from '../generators';
import type { ParticleSystem } from '../core/ParticleSystem';

export function createUI(root: HTMLElement, system: ParticleSystem): void {
  const panel = document.createElement('div');
  panel.className = 'ui-panel is-collapsed';
  panel.innerHTML = `
    <button type="button" class="ui-toggle" aria-label="收起控制面板" aria-expanded="true">←</button>
    <div class="ui-content">
      <div class="ui-top">
        <div class="ui-title">粒子形态</div>
        <div class="ui-subtitle">Particle Morph · ${MODES.length} 模式</div>
      </div>
      <input class="ui-filter" type="search" placeholder="筛选模式… / filter" aria-label="筛选模式" />
      <div class="ui-modes" role="listbox" aria-label="形态模式"></div>
      <div class="ui-row">
        <button type="button" class="ui-btn" data-action="auto">自动演示</button>
        <div class="ui-quality" title="画质">
          <button type="button" class="ui-q" data-q="low">低</button>
          <button type="button" class="ui-q active" data-q="med">中</button>
          <button type="button" class="ui-q" data-q="high">高</button>
        </div>
      </div>
      <div class="ui-hint">拖拽旋转 · 滚轮缩放 · 1–8 / a–x / Shift+A–L(NASA) · / 筛选</div>
    </div>
  `;
  root.appendChild(panel);

  const toggle = panel.querySelector('.ui-toggle') as HTMLButtonElement;
  // Only treat as desktop when wide AND fine pointer. Everything else stays collapsed by default.
  const desktopQuery = window.matchMedia('(min-width: 769px) and (pointer: fine)');
  let collapsed = !desktopQuery.matches;
  let userToggled = false;
  const syncPanel = (): void => {
    panel.classList.toggle('is-collapsed', collapsed);
    panel.classList.toggle('is-mobile-chrome', !desktopQuery.matches);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? '展开控制面板' : '收起控制面板');
    toggle.textContent = collapsed ? '→' : '←';
  };
  toggle.addEventListener('click', () => {
    userToggled = true;
    collapsed = !collapsed;
    syncPanel();
  });
  desktopQuery.addEventListener('change', () => {
    if (!userToggled) collapsed = !desktopQuery.matches;
    syncPanel();
  });
  syncPanel();

  const modesEl = panel.querySelector('.ui-modes') as HTMLElement;
  const filterEl = panel.querySelector('.ui-filter') as HTMLInputElement;
  const pills = new Map<ModeId, HTMLButtonElement>();
  const groupEls = new Map<string, HTMLElement>();

  let lastGroup = '';
  for (const m of MODES) {
    const g = m.group ?? '';
    if (g && g !== lastGroup) {
      const hdr = document.createElement('div');
      hdr.className = 'ui-group';
      hdr.dataset.group = g;
      hdr.textContent = g;
      modesEl.appendChild(hdr);
      groupEls.set(g, hdr);
      lastGroup = g;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ui-pill';
    btn.dataset.mode = m.id;
    btn.dataset.group = g;
    btn.dataset.label = `${m.key} ${m.label} ${m.id}`.toLowerCase();
    btn.innerHTML = `<span class="key">${m.key}</span><span class="label">${m.label}</span>`;
    btn.addEventListener('click', () => {
      system.setAutoDemo(false);
      syncAuto();
      system.setMode(m.id);
    });
    modesEl.appendChild(btn);
    pills.set(m.id, btn);
  }

  const applyFilter = (): void => {
    const q = filterEl.value.trim().toLowerCase();
    const visibleGroups = new Set<string>();
    pills.forEach((btn) => {
      const show = !q || (btn.dataset.label ?? '').includes(q);
      btn.style.display = show ? '' : 'none';
      if (show && btn.dataset.group) visibleGroups.add(btn.dataset.group);
    });
    groupEls.forEach((hdr, g) => {
      hdr.style.display = !q || visibleGroups.has(g) ? '' : 'none';
    });
  };
  filterEl.addEventListener('input', applyFilter);

  const autoBtn = panel.querySelector('[data-action="auto"]') as HTMLButtonElement;
  const syncAuto = (): void => {
    autoBtn.classList.toggle('active', system.isAutoDemo);
    autoBtn.textContent = system.isAutoDemo ? '停止演示' : '自动演示';
  };
  autoBtn.addEventListener('click', () => {
    system.setAutoDemo(!system.isAutoDemo);
    syncAuto();
  });

  panel.querySelectorAll('.ui-q').forEach((el) => {
    el.addEventListener('click', () => {
      const q = (el as HTMLElement).dataset.q as QualityLevel;
      system.setQuality(q);
      panel.querySelectorAll('.ui-q').forEach((b) => b.classList.remove('active'));
      el.classList.add('active');
    });
  });

  const syncMode = (mode: ModeId): void => {
    pills.forEach((btn, id) => btn.classList.toggle('active', id === mode));
    const active = pills.get(mode);
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  system.onModeChange = syncMode;
  syncMode(system.currentMode);

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const mode = MODES.find((m) => m.key === e.key);
    if (mode) {
      system.setAutoDemo(false);
      syncAuto();
      system.setMode(mode.id);
    }
    if (e.key === ' ') {
      e.preventDefault();
      system.setAutoDemo(!system.isAutoDemo);
      syncAuto();
    }
    if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      filterEl.focus();
    }
  });
}
