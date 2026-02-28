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

// --- SMART INVERT ENGINE ---

class SmartInvertEngine {
  constructor() {
    this.processedElements = new WeakSet();
    this.styleId = 'quest-smart-invert-styles';
    this.dynamicStyles = new Map(); // Element -> CSS string
    this.styleElement = null;
    this.observer = null;
    this.isEnabled = false;
    this.mutationThrottleTimeout = null;

    // Configurable thresholds
    this.bgLuminanceThreshold = 0.6; // Backgrounds brighter than this get darkened
    this.textLuminanceThreshold = 0.4; // Text darker than this gets lightened
  }

  // --- Color Utilities ---

  parseColor(colorStr) {
    if (!colorStr || colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') return null;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }

  getLuminance(r, g, b) {
    // Relative luminance formula (sRGB)
    const as = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * as[0] + 0.7152 * as[1] + 0.0722 * as[2];
  }

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // --- Inversion Logic ---

  invertColor(rgbStr, type) {
    const rgb = this.parseColor(rgbStr);
    if (!rgb) return null;

    const luminance = this.getLuminance(rgb.r, rgb.g, rgb.b);
    let hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (type === 'bg') {
      if (luminance > this.bgLuminanceThreshold) {
        // Very bright background: Darken it significantly
        // White (l=1.0) -> Dark Gray (l~0.1)
        hsl.l = 1.0 - hsl.l;
        if (hsl.l < 0.05) hsl.l = 0.08; // Prevent pure black for backgrounds (Apple/Google style)

        // Desaturate slightly to avoid jarring bright colors on dark backgrounds
        hsl.s = Math.min(hsl.s, 0.4);

        const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
        return `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b}) !important`;
      }
    } else if (type === 'text') {
      if (luminance < this.textLuminanceThreshold) {
        // Dark text: Lighten it
        // Black (l=0.0) -> Light Gray (l~0.85)
        hsl.l = 1.0 - hsl.l;
        if (hsl.l > 0.95) hsl.l = 0.88; // Prevent pure white text (eye strain)

        const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
        return `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b}) !important`;
      }
    } else if (type === 'border') {
      if (luminance > this.bgLuminanceThreshold || luminance < this.textLuminanceThreshold) {
        // Soften borders
        return `rgba(255, 255, 255, 0.15) !important`;
      }
    }
    return null;
  }

  processElement(el) {
    if (el.nodeType !== Node.ELEMENT_NODE) return;

    // Skip invisible, non-visual, or multimedia elements
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'img', 'video', 'canvas', 'svg', 'iframe'].includes(tag)) return;
    if (this.processedElements.has(el)) return;
    this.processedElements.add(el);

    const style = window.getComputedStyle(el);
    let newStyles = [];

    // Background
    const bgStr = style.backgroundColor;
    const newBg = this.invertColor(bgStr, 'bg');
    if (newBg) newStyles.push(`background-color: ${newBg};`);

    // Text Color
    const textStr = style.color;
    const newText = this.invertColor(textStr, 'text');
    if (newText) newStyles.push(`color: ${newText};`);

    // Borders
    const borderStr = style.borderColor;
    const newBorder = this.invertColor(borderStr, 'border');
    if (newBorder) newStyles.push(`border-color: ${newBorder};`);

    if (newStyles.length > 0) {
      if (!el.id) el.id = 'quest-elem-' + Math.random().toString(36).substr(2, 9);
      this.dynamicStyles.set(el.id, `#${el.id} { ${newStyles.join(' ')} }`);
    }

    // Process children
    for (let child of el.childNodes) {
      this.processElement(child);
    }
  }

  applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = this.styleId;
      (document.head || document.documentElement).appendChild(this.styleElement);
    }

    let cssText = Array.from(this.dynamicStyles.values()).join('\n');

    // Add base sweep block if needed for images that *are* strictly inverted in legacy mode, 
    // but in smart invert we leave them alone by default.
    this.styleElement.textContent = cssText + `
       html { background-color: #121212 !important; color: #e0e0e0 !important; }
       body { background-color: #121212 !important; }
    `;
  }

  walkDOM() {
    this.processElement(document.body || document.documentElement);
    this.applyStyles();
  }

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // Reset state
    this.processedElements = new WeakSet();
    this.dynamicStyles = new Map();

    // Initial walk
    this.walkDOM();

    // Observe changes
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      if (this.mutationThrottleTimeout) return;

      this.mutationThrottleTimeout = setTimeout(() => {
        let needsUpdate = false;
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.id !== this.styleId) {
              this.processElement(node);
              needsUpdate = true;
            }
          });
        });

        if (needsUpdate) this.applyStyles();
        this.mutationThrottleTimeout = null;
      }, 500); // 500ms throttle for performance
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  disable() {
    this.isEnabled = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.processedElements = new WeakSet();
    this.dynamicStyles = new Map();
  }
}

const engine = new SmartInvertEngine();

function applyDarkMode(enabled, extreme) {
  if (enabled) {
    if (isPageAlreadyDark()) return;
    engine.enable();
  } else {
    engine.disable();
  }
}

// --- OVERLAY UI CORE ---

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
      --apple-purple: #AF52DE;
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
    .icon.active-auto { stroke: var(--apple-purple); fill: rgba(175, 82, 222, 0.2); }
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

  function createSetting(label, id, type, iconClass) {
    const setting = document.createElement('div');
    setting.className = 'setting';

    const labelGroup = document.createElement('div');
    labelGroup.className = 'label-group';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `icon ${iconClass}`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    if (type === 'dark') {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
      svg.appendChild(path);
    } else if (type === 'extreme') {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', '13 2 3 14 12 14 11 22 21 10 12 10 13 2');
      svg.appendChild(poly);
    } else { // auto
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '10');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 8l4 4-4 4M8 12h7');
      svg.appendChild(circle); svg.appendChild(path);
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

  const darkSet = createSetting('Manual Mode', 'dark-toggle', 'dark', 'icon-dark');
  const extremeSet = createSetting('Extreme Mode', 'extreme-toggle', 'extreme', 'icon-extreme');
  const autoSet = createSetting('Auto Magic', 'auto-toggle', 'auto', 'icon-auto');

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
  panel.appendChild(autoSet.setting);
  panel.appendChild(warning);
  panel.appendChild(statusLabel);

  shadow.appendChild(style);
  shadow.appendChild(panel);
  document.documentElement.appendChild(container);

  chrome.storage.local.get(['darkMode', 'extremeMode', 'autoMode'], (res) => {
    darkSet.input.checked = res.darkMode || false;
    extremeSet.input.checked = res.extremeMode || false;
    autoSet.input.checked = res.autoMode || false;
    updateUIState(darkSet.input.checked, extremeSet.input.checked, autoSet.input.checked);
  });

  const sync = () => {
    chrome.storage.local.set({
      darkMode: darkSet.input.checked,
      extremeMode: extremeSet.input.checked,
      autoMode: autoSet.input.checked
    });
    applyDarkMode(darkSet.input.checked || (autoSet.input.checked && !isPageAlreadyDark()), extremeSet.input.checked);
    updateUIState(darkSet.input.checked, extremeSet.input.checked, autoSet.input.checked);
  };

  darkSet.input.addEventListener('change', sync);
  extremeSet.input.addEventListener('change', sync);
  autoSet.input.addEventListener('change', sync);

  function updateUIState(d, e, a) {
    statusLabel.textContent = (d || a) ? (e ? 'Extreme Active' : (a ? 'Auto Magic Active' : 'Manual Active')) : 'Off';
    statusLabel.style.color = (d || a) ? 'var(--apple-green)' : 'var(--text-sec)';
    if (d) darkSet.svg.classList.add('active-dark'); else darkSet.svg.classList.remove('active-dark');
    if (d && e) extremeSet.svg.classList.add('active-extreme'); else extremeSet.svg.classList.remove('active-extreme');
    if (a) autoSet.svg.classList.add('active-auto'); else autoSet.svg.classList.remove('active-auto');
  }
}

function toggleOverlay() {
  if (!questOverlay) createOverlay();
  overlayVisible = !overlayVisible;
  if (overlayVisible) questOverlay.classList.add('visible');
  else questOverlay.classList.remove('visible');
}

// --- MESSAGING & INITIALIZATION ---

function showToast(message) {
  let toast = document.getElementById('quest-toast-notification');
  if (toast) toast.remove();

  toast = document.createElement('div');
  toast.id = 'quest-toast-notification';
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0.9)',
    backgroundColor: 'rgba(28, 28, 30, 0.85)',
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    zIndex: '2147483647', // Max z-index
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255, 255, 255, 0.15)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
  });

  document.documentElement.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleOverlay") toggleOverlay();
  if (msg.action === "toggleSmartInvert") {
    // Basic toggle of the dark mode state, triggered by clicking the extension icon.
    chrome.storage.local.get(['darkMode', 'extremeMode'], (res) => {
      const newState = !res.darkMode;
      chrome.storage.local.set({ darkMode: newState });
      applyDarkMode(newState, res.extremeMode);

      // Show the popup notification
      showToast(newState ? 'Dark Mode On' : 'Dark Mode Off');
    });
  }
});

chrome.storage.local.get(['darkMode', 'extremeMode', 'autoMode'], (res) => {
  const shouldBeDark = res.darkMode || (res.autoMode && !isPageAlreadyDark());
  if (shouldBeDark) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => applyDarkMode(true, res.extremeMode));
    } else {
      applyDarkMode(true, res.extremeMode);
    }
  }
});
