let observer = null;
let overlayVisible = false;
let questOverlay = null;
let mutationThrottleTimeout = null;

// --- CORE DARK MODE ENGINE ---

function isPageAlreadyDark() {
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme && metaColorScheme.content.includes('dark')) return true;

  const darkIndicators = ['dark', 'night', 'theme-dark', 'dark-mode'];
  const bodyData = document.body ? JSON.stringify(document.body.dataset).toLowerCase() : '';
  const htmlData = JSON.stringify(document.documentElement.dataset).toLowerCase();

  if (darkIndicators.some(indicator =>
    document.documentElement.classList.contains(indicator) ||
    (document.body && document.body.classList.contains(indicator)) ||
    bodyData.includes(indicator) ||
    htmlData.includes(indicator)
  )) return true;

  const getBG = (el) => el ? window.getComputedStyle(el).backgroundColor : null;
  let bgColor = getBG(document.documentElement);
  if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    bgColor = getBG(document.body);
  }

  if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return false;

  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return false;

  const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.4;
}

function applyDarkMode(enabled, extreme) {
  const styleId = 'quest-dark-mode-style';
  let styleEl = document.getElementById(styleId);

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (enabled) {
    if (isPageAlreadyDark()) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        html { 
          filter: invert(1) hue-rotate(180deg) !important;
          background-color: #ffffff !important;
          /* Cinematic Magic Transition: Thanos Snap */
          transition: filter 1.5s cubic-bezier(0.19, 1, 0.22, 1), background-color 1.5s cubic-bezier(0.19, 1, 0.22, 1) !important;
        }
        img, video, canvas, [style*="background-image"], .no-invert { 
          filter: invert(1) hue-rotate(180deg) !important;
          transition: filter 1.5s cubic-bezier(0.19, 1, 0.22, 1) !important;
        }
        [class*="gradient"], [class*="overlay"], [class*="mask"] {
           filter: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(styleEl);

      // Trigger a "magic wash" effect by momentarily setting opacity or scale
      document.documentElement.animate([
        { filter: 'invert(0) hue-rotate(0deg)', opacity: 0.9 },
        { filter: 'invert(1) hue-rotate(180deg)', opacity: 1 }
      ], {
        duration: 1500,
        easing: 'cubic-bezier(0.19, 1, 0.22, 1)'
      });
    }

    if (extreme) {
      // 🔴 ENERGY OPTIMIZATION: Throttled MutationObserver 🔴
      observer = new MutationObserver(() => {
        if (mutationThrottleTimeout) return;
        mutationThrottleTimeout = setTimeout(() => {
          mutationThrottleTimeout = null;
        }, 1000);
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  } else {
    if (styleEl) {
      styleEl.remove();
      // Optional: Smooth transition BACK to light
      document.documentElement.animate([
        { filter: 'invert(1) hue-rotate(180deg)' },
        { filter: 'invert(0) hue-rotate(0deg)' }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.19, 1, 0.22, 1)'
      });
    }
  }
}

// --- OVERLAY UI CORE (SECURE BY DESIGN) ---

function createOverlay() {
  if (questOverlay) return;

  const container = document.createElement('div');
  container.id = 'quest-overlay-container';
  const shadow = container.attachShadow({ mode: 'closed' });
  questOverlay = container;

  const style = document.createElement('style');
  style.textContent = `
    :host {
      --glass-background: transparent; 
      --glass-blur: 24px;
      --glass-saturation: 180%;
      --glass-brightness: 1.1;
      --glass-contrast: 1.1;
      --apple-green: #30d158;
      --apple-gold: #ffcc00;
      --apple-blue: #0A84FF;
      --text-main: #ffffff;
      --text-sec: rgba(255, 255, 255, 0.6);
      position: fixed; top: 20px; right: 20px; z-index: 2147483647; width: 260px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif;
      color: var(--text-main); user-select: none; pointer-events: auto;
      opacity: 0; transform: translateY(-10px) scale(0.95);
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); visibility: hidden;
    }
    :host(.visible) { opacity: 1; transform: translateY(0) scale(1); visibility: visible; }
    .glass-panel {
      padding: 20px; background: var(--glass-background);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness)) contrast(var(--glass-contrast));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness)) contrast(var(--glass-contrast));
      border: 0.5px solid rgba(255, 255, 255, 0.2); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    h1 { font-size: 1.1rem; margin: 0 0 4px 0; text-align: center; }
    .subtitle { font-size: 0.8rem; color: var(--text-sec); margin: 0 0 20px 0; text-align: center; }
    .setting {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
      padding: 12px; background: rgba(255, 255, 255, 0.08); border-radius: 14px; border: 0.5px solid rgba(255, 255, 255, 0.1);
    }
    .label-group { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; }
    .icon { width: 18px; height: 18px; stroke: var(--text-sec); fill: none; transition: 0.3s; }
    .icon.active-dark { stroke: var(--apple-gold); fill: rgba(255, 204, 0, 0.2); }
    .icon.active-extreme { stroke: var(--apple-blue); fill: rgba(10, 132, 255, 0.2); }
    .switch { position: relative; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.4s;
    }
    .slider:before {
      position: absolute; content: ""; height: 20px; width: 20px; left: 2px; bottom: 2px;
      background: #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: 0.4s;
    }
    input:checked + .slider { background: var(--apple-green); }
    input:checked + .slider:before { transform: translateX(20px); }
    .warning { font-size: 0.7rem; color: #ff9f0a; text-align: center; margin-top: 4px; }
    #status-label { font-size: 0.65rem; color: var(--text-sec); text-align: center; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  `;

  const panel = document.createElement('div');
  panel.className = 'glass-panel';

  const h1 = document.createElement('h1');
  h1.textContent = 'Quest Dark Mode';

  const subtitle = document.createElement('div');
  subtitle.className = 'subtitle';
  subtitle.textContent = 'Premium Visual Content Overlay';

  // Secure Setting Factory
  function createSetting(label, id, iconPath, iconClass) {
    const setting = document.createElement('div');
    setting.className = 'setting';

    const labelGroup = document.createElement('div');
    labelGroup.className = 'label-group';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `icon ${iconClass}`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    if (id === 'dark-toggle') {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
      svg.appendChild(path);
    } else {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', '13 2 3 14 12 14 11 22 21 10 12 10 13 2');
      svg.appendChild(poly);
    }

    const span = document.createElement('span');
    span.textContent = label;

    labelGroup.appendChild(svg);
    labelGroup.appendChild(span);

    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;

    const slider = document.createElement('span');
    slider.className = 'slider';

    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);

    setting.appendChild(labelGroup);
    setting.appendChild(switchLabel);

    return { setting, input, svg };
  }

  const darkSet = createSetting('Dark Mode', 'dark-toggle', '', 'icon-dark');
  const extremeSet = createSetting('Extreme Mode', 'extreme-toggle', '', 'icon-extreme');

  const warning = document.createElement('div');
  warning.className = 'warning';
  warning.textContent = '⚠️ High precision uses more power';

  const statusLabel = document.createElement('div');
  statusLabel.id = 'status-label';
  statusLabel.textContent = 'OFF';

  panel.appendChild(h1);
  panel.appendChild(subtitle);
  panel.appendChild(darkSet.setting);
  panel.appendChild(extremeSet.setting);
  panel.appendChild(warning);
  panel.appendChild(statusLabel);

  shadow.appendChild(style);
  shadow.appendChild(panel);
  document.documentElement.appendChild(container);

  // Sync Logic
  chrome.storage.local.get(['darkMode', 'extremeMode'], (res) => {
    darkSet.input.checked = res.darkMode || false;
    extremeSet.input.checked = res.extremeMode || false;
    updateUIState(darkSet.input.checked, extremeSet.input.checked);
  });

  const sync = () => {
    chrome.storage.local.set({ darkMode: darkSet.input.checked, extremeMode: extremeSet.input.checked });
    applyDarkMode(darkSet.input.checked, extremeSet.input.checked);
    updateUIState(darkSet.input.checked, extremeSet.input.checked);
  };

  darkSet.input.addEventListener('change', sync);
  extremeSet.input.addEventListener('change', sync);

  function updateUIState(d, e) {
    statusLabel.textContent = d ? (e ? 'Extreme Active' : 'Active') : 'Off';
    statusLabel.style.color = d ? 'var(--apple-green)' : 'var(--text-sec)';
    if (d) darkSet.svg.classList.add('active-dark'); else darkSet.svg.classList.remove('active-dark');
    if (d && e) extremeSet.svg.classList.add('active-extreme'); else extremeSet.svg.classList.remove('active-extreme');
  }
}

function toggleOverlay() {
  if (!questOverlay) createOverlay();
  overlayVisible = !overlayVisible;
  if (overlayVisible) questOverlay.classList.add('visible');
  else questOverlay.classList.remove('visible');
}

// --- MESSAGING & INITIALIZATION ---

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleOverlay") toggleOverlay();
});

chrome.storage.local.get(['darkMode', 'extremeMode'], (res) => {
  if (res.darkMode) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => applyDarkMode(true, res.extremeMode));
    } else {
      applyDarkMode(true, res.extremeMode);
    }
  }
});
