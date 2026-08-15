/**
 * Settings Modal & User Preferences Controller
 * Handles wallpaper selection, search focus blur, 12h/24h clock, search engine,
 * and dynamic RGB Accent Color system with custom element opacities.
 */

import { PRESET_WALLPAPERS } from './wallpaper.js';
import { SEARCH_ENGINES } from './search.js';

export const PRESET_ACCENT_COLORS = [
  { name: 'Cyan Blue', hex: '#00ffff' },
  { name: 'Neon Pink', hex: '#ff007f' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Electric Violet', hex: '#8b5cf6' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Royal Blue', hex: '#3b82f6' }
];

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  if (isNaN(num)) return '0, 255, 255';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export class SettingsManager {
  constructor(options = {}) {
    this.modalEl = document.getElementById(options.modalId || 'settingsModal');
    this.openBtn = document.getElementById(options.openBtnId || 'settingsToggleBtn');
    this.closeBtn = document.getElementById(options.closeBtnId || 'closeSettingsBtn');
    
    this.wallpaperEngine = options.wallpaperEngine;
    this.clockWidget = options.clockWidget;
    this.searchManager = options.searchManager;
  }

  init() {
    this.initAccentColor();
    this.setupEventListeners();
    this.renderWallpaperOptions();
    this.renderSearchEngineOptions();
    this.renderAccentColorSwatches();
    this.syncFormState();
  }

  initAccentColor() {
    const savedHex = localStorage.getItem('accent_color') || '#00ffff';
    const rgbStr = hexToRgb(savedHex);
    document.documentElement.style.setProperty('--accent-rgb', rgbStr);
  }

  setAccentColor(hex) {
    const rgbStr = hexToRgb(hex);
    document.documentElement.style.setProperty('--accent-rgb', rgbStr);
    localStorage.setItem('accent_color', hex);
    this.updateActiveColorSwatch(hex);
  }

  setupEventListeners() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) this.close();
      });
    }

    // Color Picker Input
    const colorPicker = document.getElementById('accentColorPicker');
    if (colorPicker) {
      const savedHex = localStorage.getItem('accent_color') || '#00ffff';
      colorPicker.value = savedHex;

      colorPicker.addEventListener('input', (e) => {
        this.setAccentColor(e.target.value);
      });
    }

    // Custom Wallpaper Upload Input
    const uploadInput = document.getElementById('customWallpaperInput');
    if (uploadInput) {
      uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && this.wallpaperEngine) {
          try {
            const customWp = await this.wallpaperEngine.saveCustomWallpaper(file);
            if (customWp) {
              this.renderWallpaperOptions();
            }
          } catch (err) {
            console.error('Failed to upload custom wallpaper', err);
          }
        }
      });
    }

    // Search Focus Blur Slider
    const blurSlider = document.getElementById('searchBlurSlider');
    const blurValLabel = document.getElementById('searchBlurValueLabel');
    if (blurSlider) {
      const savedBlur = localStorage.getItem('search_focus_blur') || '12';
      blurSlider.value = savedBlur;
      if (blurValLabel) blurValLabel.textContent = `${savedBlur}px`;
      document.documentElement.style.setProperty('--search-blur-amount', `${savedBlur}px`);

      blurSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (blurValLabel) blurValLabel.textContent = `${val}px`;
        document.documentElement.style.setProperty('--search-blur-amount', `${val}px`);
        localStorage.setItem('search_focus_blur', val);
      });
    }

    // 12h/24h Toggle
    const clockFormatSelect = document.getElementById('clockFormatSelect');
    if (clockFormatSelect) {
      clockFormatSelect.addEventListener('change', (e) => {
        const is24h = e.target.value === '24';
        localStorage.setItem('clock_24h', is24h);
        if (this.clockWidget) this.clockWidget.set24HourMode(is24h);
      });
    }

    // Search Engine Select
    const searchEngineSelect = document.getElementById('settingsSearchEngineSelect');
    if (searchEngineSelect) {
      searchEngineSelect.addEventListener('change', (e) => {
        if (this.searchManager) this.searchManager.setEngine(e.target.value);
      });
    }
  }

  open() {
    if (this.modalEl) {
      this.modalEl.classList.add('open');
      this.syncFormState();
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.remove('open');
    }
  }

  renderAccentColorSwatches() {
    const container = document.getElementById('accentColorSwatches');
    if (!container) return;
    container.innerHTML = '';

    const currentHex = (localStorage.getItem('accent_color') || '#00ffff').toLowerCase();

    PRESET_ACCENT_COLORS.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${c.hex.toLowerCase() === currentHex ? 'active' : ''}`;
      swatch.style.backgroundColor = c.hex;
      swatch.title = c.name;

      swatch.addEventListener('click', () => {
        this.setAccentColor(c.hex);
        const picker = document.getElementById('accentColorPicker');
        if (picker) picker.value = c.hex;
      });

      container.appendChild(swatch);
    });
  }

  updateActiveColorSwatch(hex) {
    const swatches = document.querySelectorAll('.color-swatch');
    const currentHex = hex.toLowerCase();
    swatches.forEach(swatch => {
      const bg = swatch.style.backgroundColor;
      // Compare hex values
      swatch.classList.toggle('active', swatch.title && PRESET_ACCENT_COLORS.find(p => p.name === swatch.title && p.hex.toLowerCase() === currentHex));
    });
  }

  renderWallpaperOptions() {
    const grid = document.getElementById('wallpaperGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const activeId = localStorage.getItem('active_wallpaper_id') || 'lofi-room';

    PRESET_WALLPAPERS.forEach(wp => {
      const thumb = document.createElement('div');
      thumb.className = `wallpaper-thumb ${wp.id === activeId ? 'active' : ''}`;
      thumb.style.backgroundImage = `url(${wp.poster || wp.url})`;
      
      thumb.innerHTML = `<span class="wallpaper-thumb-label">${wp.name}</span>`;

      thumb.addEventListener('click', async () => {
        if (this.wallpaperEngine) {
          this.wallpaperEngine.loadPresetWallpaper(wp.id);
          this.renderWallpaperOptions();
        }
      });

      grid.appendChild(thumb);
    });
  }

  renderSearchEngineOptions() {
    const select = document.getElementById('settingsSearchEngineSelect');
    if (!select) return;
    select.innerHTML = '';

    SEARCH_ENGINES.forEach(eng => {
      const opt = document.createElement('option');
      opt.value = eng.id;
      opt.textContent = eng.name;
      select.appendChild(opt);
    });
  }

  syncFormState() {
    const clockSelect = document.getElementById('clockFormatSelect');
    if (clockSelect) {
      const is24h = localStorage.getItem('clock_24h') === 'true';
      clockSelect.value = is24h ? '24' : '12';
    }

    const searchSelect = document.getElementById('settingsSearchEngineSelect');
    if (searchSelect && this.searchManager) {
      searchSelect.value = this.searchManager.activeEngine.id;
    }

    const blurSlider = document.getElementById('searchBlurSlider');
    if (blurSlider) {
      blurSlider.value = localStorage.getItem('search_focus_blur') || '12';
    }

    const colorPicker = document.getElementById('accentColorPicker');
    if (colorPicker) {
      colorPicker.value = localStorage.getItem('accent_color') || '#00ffff';
    }

    this.renderAccentColorSwatches();
  }
}
