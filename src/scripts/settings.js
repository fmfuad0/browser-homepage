/**
 * Settings Modal & User Preferences Controller
 * Handles wallpaper selection, search focus blur, 12h/24h clock, search engine,
 * dynamic RGB Accent Color system, and City Search for accurate weather without permissions.
 */

import { PRESET_WALLPAPERS } from './wallpaper.js';
import { SEARCH_ENGINES } from './search.js';
import { WeatherGreetingService } from './weather.js';

export const PRESET_ACCENT_COLORS = [
  { name: 'Cyan Blue', hex: '#00ffff' },
  { name: 'Neon Pink', hex: '#ff007f' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Electric Violet', hex: '#8b5cf6' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Royal Blue', hex: '#3b82f6' }
];

export const PRESET_FONTS = [
  { id: 'outfit', name: 'Outfit (Modern Sans)', family: "'Outfit', sans-serif", googleName: 'Outfit' },
  { id: 'inter', name: 'Inter (Clean Tech)', family: "'Inter', sans-serif", googleName: 'Inter' },
  { id: 'roboto-mono', name: 'Roboto Mono (Monospace)', family: "'Roboto Mono', monospace", googleName: 'Roboto+Mono' },
  { id: 'space-grotesk', name: 'Space Grotesk (Futuristic)', family: "'Space Grotesk', sans-serif", googleName: 'Space+Grotesk' },
  { id: 'playfair-display', name: 'Playfair Display (Serif)', family: "'Playfair Display', serif", googleName: 'Playfair+Display' },
  { id: 'cinzel', name: 'Cinzel (Classic Roman)', family: "'Cinzel', serif", googleName: 'Cinzel' }
];

export function injectGoogleFont(fontName) {
  if (!fontName) return;
  const cleanName = fontName.trim();
  const fontId = 'gfont-' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (document.getElementById(fontId)) return;

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  const urlParam = cleanName.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${urlParam}:wght@300;400;600;700&display=swap`;
  document.head.appendChild(link);
}

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
    this.weatherService = options.weatherService;

    this.citySearchTimeout = null;

    // Track Object URLs created for gallery thumbnails to prevent memory leaks
    this.galleryObjectUrls = [];
    this.thumbObserver = null;

    this.onBeforeOpen = options.onBeforeOpen;
  }

  init() {
    this.initAccentColor();
    this.initTypography();
    this.setupEventListeners();
    this.renderWallpaperOptions();
    this.renderSearchEngineOptions();
    this.renderAccentColorSwatches();
    this.renderFontOptions();
    this.initAutoHideRightMenu();
    this.initShortcutBorderRadius();
    this.initShortcutSize();
    this.initHideShortcutTitle();
    this.syncFormState();
  }

  initAutoHideRightMenu() {
    const isEnabled = localStorage.getItem('auto_hide_right_menu') === 'true';
    document.documentElement.classList.toggle('auto-hide-right-menu', isEnabled);
    document.body.classList.toggle('auto-hide-right-menu', isEnabled);

    const toggleInput = document.getElementById('autoHideRightMenuToggle');
    if (toggleInput) {
      toggleInput.checked = isEnabled;
      toggleInput.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('auto_hide_right_menu', val);
        document.documentElement.classList.toggle('auto-hide-right-menu', val);
        document.body.classList.toggle('auto-hide-right-menu', val);
      });
    }
  }

  initShortcutBorderRadius() {
    const savedRadius = localStorage.getItem('shortcut_icon_border_radius') || '20%';
    this.setShortcutBorderRadius(savedRadius);

    const radiusGroup = document.getElementById('shortcutRadiusOptions');
    if (radiusGroup) {
      const btns = radiusGroup.querySelectorAll('.radius-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.radius;
          this.setShortcutBorderRadius(val);
        });
      });
    }
  }

  initShortcutSize() {
    const savedSize = localStorage.getItem('shortcut_card_size') || '70px';
    this.setShortcutSize(savedSize);

    const sizeGroup = document.getElementById('shortcutSizeOptions');
    if (sizeGroup) {
      const btns = sizeGroup.querySelectorAll('.size-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.size;
          this.setShortcutSize(val);
        });
      });
    }
  }

  setShortcutSize(val) {
    const sizeMap = {
      '56px': { icon: '28px', font: '0.68rem', padding: '0.35rem 0.2rem', gap: '0.15rem' },
      '70px': { icon: '36px', font: '0.78rem', padding: '0.45rem 0.3rem', gap: '0.25rem' },
      '84px': { icon: '44px', font: '0.85rem', padding: '0.55rem 0.4rem', gap: '0.3rem' },
      '98px': { icon: '52px', font: '0.92rem', padding: '0.65rem 0.5rem', gap: '0.35rem' }
    };
    const preset = sizeMap[val] || sizeMap['70px'];

    document.documentElement.style.setProperty('--shortcut-card-size', val);
    document.documentElement.style.setProperty('--shortcut-icon-size', preset.icon);
    document.documentElement.style.setProperty('--shortcut-font-size', preset.font);
    document.documentElement.style.setProperty('--shortcut-card-padding', preset.padding);
    document.documentElement.style.setProperty('--shortcut-card-gap', preset.gap);
    localStorage.setItem('shortcut_card_size', val);

    const sizeGroup = document.getElementById('shortcutSizeOptions');
    if (sizeGroup) {
      const btns = sizeGroup.querySelectorAll('.size-btn');
      btns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === val);
      });
    }
  }

  initHideShortcutTitle() {
    const isHidden = localStorage.getItem('hideShortcutTitle') === 'true';
    document.documentElement.classList.toggle('hide-shortcut-titles', isHidden);
    document.body.classList.toggle('hide-shortcut-titles', isHidden);

    const toggleInput = document.getElementById('hideShortcutTitleToggle');
    if (toggleInput) {
      toggleInput.checked = isHidden;
      toggleInput.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('hideShortcutTitle', val);
        document.documentElement.classList.toggle('hide-shortcut-titles', val);
        document.body.classList.toggle('hide-shortcut-titles', val);
      });
    }
  }

  setShortcutBorderRadius(val) {
    document.documentElement.style.setProperty('--shortcut-icon-border-radius', val);
    localStorage.setItem('shortcut_icon_border_radius', val);

    const radiusGroup = document.getElementById('shortcutRadiusOptions');
    if (radiusGroup) {
      const btns = radiusGroup.querySelectorAll('.radius-btn');
      btns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.radius === val);
      });
    }
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

  initTypography() {
    const customFonts = this.getCustomImportedFonts();
    customFonts.forEach(f => injectGoogleFont(f));

    PRESET_FONTS.forEach(p => {
      if (p.googleName) injectGoogleFont(p.googleName);
    });

    const clockFont = localStorage.getItem('clock_font_family') || "'Outfit', sans-serif";
    const greetingFont = localStorage.getItem('greeting_font_family') || "'Outfit', sans-serif";

    [clockFont, greetingFont].forEach(fVal => {
      const match = fVal.match(/'([^']+)'/);
      if (match && match[1]) {
        injectGoogleFont(match[1]);
      }
    });

    document.documentElement.style.setProperty('--clock-font-family', clockFont);
    document.documentElement.style.setProperty('--greeting-font-family', greetingFont);
  }

  getCustomImportedFonts() {
    try {
      const saved = localStorage.getItem('custom_imported_fonts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCustomImportedFonts(fonts) {
    localStorage.setItem('custom_imported_fonts', JSON.stringify(fonts.slice(0, 4)));
  }

  initTabNavigation() {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const savedTab = localStorage.getItem('active_settings_tab') || 'appearance';

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });

    this.switchTab(savedTab);
  }

  switchTab(tabId) {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const tabPanes = document.querySelectorAll('.settings-tab-pane');

    let targetPane = document.getElementById(`tab-${tabId}`);
    if (!targetPane) {
      tabId = 'appearance';
      targetPane = document.getElementById('tab-appearance');
    }

    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    localStorage.setItem('active_settings_tab', tabId);

    if (tabId === 'wallpaper') {
      this.renderWallpaperOptions();
    } else {
      this.cleanupWallpaperGallery();
    }
  }

  setupEventListeners() {
    this.initTabNavigation();

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

    // User Display Name Input
    const nameInput = document.getElementById('userDisplayNameInput');
    if (nameInput) {
      nameInput.value = localStorage.getItem('user_display_name') || '';
      nameInput.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('user_display_name', val);
        if (this.weatherService) {
          this.weatherService.updateGreetingHeading();
        }
      });
    }

    // Font Selectors
    const clockFontSelect = document.getElementById('clockFontSelect');
    if (clockFontSelect) {
      clockFontSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const fontMatch = val.match(/'([^']+)'/);
        if (fontMatch && fontMatch[1]) {
          injectGoogleFont(fontMatch[1]);
        }
        document.documentElement.style.setProperty('--clock-font-family', val);
        localStorage.setItem('clock_font_family', val);
      });
    }

    const greetingFontSelect = document.getElementById('greetingFontSelect');
    if (greetingFontSelect) {
      greetingFontSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const fontMatch = val.match(/'([^']+)'/);
        if (fontMatch && fontMatch[1]) {
          injectGoogleFont(fontMatch[1]);
        }
        document.documentElement.style.setProperty('--greeting-font-family', val);
        localStorage.setItem('greeting_font_family', val);
      });
    }

    // Custom Font Import Button
    const importFontBtn = document.getElementById('importFontBtn');
    const customFontInput = document.getElementById('customFontInput');

    if (importFontBtn && customFontInput) {
      const handleImport = () => {
        const query = customFontInput.value.trim();
        if (!query) return;

        let fontName = query;
        if (query.includes('family=')) {
          const match = query.match(/family=([^&:]+)/);
          if (match && match[1]) {
            fontName = decodeURIComponent(match[1]).replace(/\+/g, ' ');
          }
        }

        const customFonts = this.getCustomImportedFonts();
        if (customFonts.length >= 4) {
          alert('Maximum limit of 4 custom imported fonts reached! Remove a font before adding another.');
          return;
        }

        if (!customFonts.includes(fontName)) {
          customFonts.push(fontName);
          this.saveCustomImportedFonts(customFonts);
          injectGoogleFont(fontName);
          customFontInput.value = '';
          this.renderFontOptions();
        }
      };

      importFontBtn.addEventListener('click', handleImport);
      customFontInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleImport();
        }
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

    // City Search Input for Weather
    const cityInput = document.getElementById('weatherCityInput');
    const cityResults = document.getElementById('weatherCityResults');
    const autoIpBtn = document.getElementById('autoIpWeatherBtn');

    if (cityInput && cityResults) {
      cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (this.citySearchTimeout) clearTimeout(this.citySearchTimeout);

        if (query.length < 2) {
          cityResults.style.display = 'none';
          cityResults.innerHTML = '';
          return;
        }

        this.citySearchTimeout = setTimeout(async () => {
          const results = await WeatherGreetingService.searchCities(query);
          if (results.length > 0) {
            cityResults.innerHTML = '';
            results.forEach(res => {
              const item = document.createElement('div');
              item.className = 'city-search-item';
              item.textContent = res.label;
              item.addEventListener('click', async () => {
                cityInput.value = res.name;
                cityResults.style.display = 'none';
                if (this.weatherService) {
                  await this.weatherService.setLocation(res.lat, res.lon, res.name);
                }
              });
              cityResults.appendChild(item);
            });
            cityResults.style.display = 'block';
          } else {
            cityResults.style.display = 'none';
          }
        }, 300);
      });

      document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !cityResults.contains(e.target)) {
          cityResults.style.display = 'none';
        }
      });
    }

    if (autoIpBtn) {
      autoIpBtn.addEventListener('click', async () => {
        if (cityInput) cityInput.value = '';
        if (this.weatherService) {
          await this.weatherService.clearCustomLocation();
        }
      });
    }

    // Wallpaper Folder Selection Button
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const folderInput = document.getElementById('folderWallpaperInput');

    if (selectFolderBtn) {
      selectFolderBtn.addEventListener('click', async () => {
        if ('showDirectoryPicker' in window) {
          try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
            if (dirHandle && this.wallpaperEngine) {
              await this.wallpaperEngine.scanAndSaveDirectoryHandle(dirHandle);
              await this.renderWallpaperOptions();
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.warn('Directory picker failed, falling back to input:', err);
              if (folderInput) folderInput.click();
            }
          }
        } else if (folderInput) {
          folderInput.click();
        }
      });
    }

    if (folderInput) {
      folderInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0 && this.wallpaperEngine) {
          try {
            const records = await this.wallpaperEngine.saveCustomFiles(e.target.files);
            if (records && records.length > 0) {
              const newestId = records[records.length - 1].id;
              await this.wallpaperEngine.loadCustomWallpaperFromDB(newestId);
            }
            await this.renderWallpaperOptions();
          } catch (err) {
            console.error('Failed to process folder wallpapers:', err);
          }
        }
      });
    }

    // Custom Files Upload Input
    const uploadInput = document.getElementById('customWallpaperInput');
    const addFilesBtn = document.getElementById('addFilesBtn');
    
    if (addFilesBtn && uploadInput) {
      addFilesBtn.addEventListener('click', (e) => {
        // Fallback for browsers requiring explicit click dispatch
        uploadInput.click();
      });
    }

    if (uploadInput) {
      uploadInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0 && this.wallpaperEngine) {
          try {
            const records = await this.wallpaperEngine.saveCustomFiles(e.target.files);
            if (records && records.length > 0) {
              const newestId = records[records.length - 1].id;
              await this.wallpaperEngine.loadCustomWallpaperFromDB(newestId);
            }
            await this.renderWallpaperOptions();
          } catch (err) {
            console.error('Failed to upload custom wallpapers:', err);
          }
        }
      });
    }

    // Clear Custom Gallery Button
    const clearGalleryBtn = document.getElementById('clearCustomGalleryBtn');
    if (clearGalleryBtn) {
      clearGalleryBtn.addEventListener('click', async () => {
        if (confirm('Clear all custom wallpapers from browser gallery?') && this.wallpaperEngine) {
          await this.wallpaperEngine.clearAllCustomWallpapers();
          await this.renderWallpaperOptions();
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
    if (typeof this.onBeforeOpen === 'function') {
      this.onBeforeOpen();
    }
    if (this.modalEl) {
      this.modalEl.classList.add('open');
      this.syncFormState();
      const activeTab = localStorage.getItem('active_settings_tab') || 'appearance';
      if (activeTab === 'wallpaper') {
        this.renderWallpaperOptions();
      }
      if (this.wallpaperEngine) {
        this.wallpaperEngine.pauseShader();
      }
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.remove('open');
      this.cleanupWallpaperGallery();
      if (this.wallpaperEngine) {
        this.wallpaperEngine.resumeShader();
      }
    }
  }

  cleanupWallpaperGallery() {
    if (this.thumbObserver) {
      this.thumbObserver.disconnect();
      this.thumbObserver = null;
    }
    const grid = document.getElementById('wallpaperGrid');
    if (grid) {
      const videos = grid.querySelectorAll('video');
      videos.forEach(v => {
        v.pause();
        v.removeAttribute('src');
        v.load();
      });
      grid.innerHTML = '';
    }
    if (this.galleryObjectUrls && this.galleryObjectUrls.length > 0) {
      this.galleryObjectUrls.forEach(url => URL.revokeObjectURL(url));
      this.galleryObjectUrls = [];
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
      swatch.classList.toggle('active', swatch.title && PRESET_ACCENT_COLORS.find(p => p.name === swatch.title && p.hex.toLowerCase() === currentHex));
    });
  }

  async renderWallpaperOptions() {
    const grid = document.getElementById('wallpaperGrid');
    const badge = document.getElementById('wallpaperCountBadge');
    const clearBtn = document.getElementById('clearCustomGalleryBtn');
    if (!grid) return;

    this.cleanupWallpaperGallery();

    const activeId = localStorage.getItem('active_wallpaper_id') || 'shader-aurora';

    let customWallpapers = [];
    if (this.wallpaperEngine) {
      customWallpapers = await this.wallpaperEngine.getAllCustomWallpapers();
    }

    const allWallpapers = [
      ...PRESET_WALLPAPERS,
      ...customWallpapers
    ];

    if (badge) {
      badge.textContent = `${allWallpapers.length} Wallpaper${allWallpapers.length === 1 ? '' : 's'}`;
    }

    if (clearBtn) {
      clearBtn.style.display = customWallpapers.length > 0 ? 'flex' : 'none';
    }

    const observerOptions = {
      root: grid,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.thumbObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const thumb = entry.target;
          observer.unobserve(thumb);

          const wpId = thumb.dataset.wpId;
          const isVideo = thumb.dataset.isVideo === 'true';
          const isCustom = wpId.startsWith('custom-');
          const mediaEl = thumb.querySelector('.wallpaper-thumb-media');

          if (!mediaEl) return;

          let mediaSrc = thumb.dataset.presetUrl || '';

          if (isCustom && this.wallpaperEngine) {
            const customWp = await this.wallpaperEngine.getCustomWallpaperById(wpId);
            if (customWp) {
              // For video: use thumbnailBlob (static JPEG frame) – no video decoding lag
              // For image: use the full blob
              const previewBlob = isVideo ? customWp.thumbnailBlob : customWp.blob;

              if (!previewBlob && customWp.handle && !isVideo) {
                // Fallback to file handle for images only
                try {
                  const perm = await customWp.handle.queryPermission({ mode: 'read' });
                  if (perm === 'granted') {
                    const file = await customWp.handle.getFile();
                    const objectUrl = URL.createObjectURL(file);
                    this.galleryObjectUrls.push(objectUrl);
                    mediaSrc = objectUrl;
                  }
                } catch (e) {}
              } else if (previewBlob) {
                const objectUrl = URL.createObjectURL(previewBlob);
                this.galleryObjectUrls.push(objectUrl);
                mediaSrc = objectUrl;
              }
            }
          }

          if (mediaSrc) {
            mediaEl.src = mediaSrc;
          }
        }
      });
    }, observerOptions);

    allWallpapers.forEach(wp => {
      const isCustom = wp.id.startsWith('custom-');
      const isVideo = wp.type === 'video';
      const isShader = wp.type === 'shader';

      const thumb = document.createElement('div');
      thumb.className = `wallpaper-thumb ${wp.id === activeId ? 'active' : ''}`;
      thumb.dataset.wpId = wp.id;
      thumb.dataset.isVideo = isVideo ? 'true' : 'false';
      if (!isCustom && !isShader) {
        thumb.dataset.presetUrl = wp.url || '';
      }

      // Type Badge
      const typeBadge = document.createElement('span');
      typeBadge.className = `wallpaper-type-badge ${isShader ? 'shader-badge' : isVideo ? 'video-badge' : ''}`;
      typeBadge.textContent = isShader ? 'SHADER' : isVideo ? 'VIDEO' : 'IMG';
      thumb.appendChild(typeBadge);

      // Delete Button for Custom Wallpapers
      if (isCustom) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'wallpaper-delete-btn';
        deleteBtn.title = 'Remove wallpaper';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (this.wallpaperEngine) {
            await this.wallpaperEngine.deleteCustomWallpaper(wp.id);
            await this.renderWallpaperOptions();
          }
        });
        thumb.appendChild(deleteBtn);
      }

      if (isShader) {
        const previewEl = document.createElement('div');
        previewEl.className = `wallpaper-thumb-shader-preview ${wp.shaderKey || 'aurora'}`;
        thumb.appendChild(previewEl);
      } else {
        // Use a static <img> for both images and video thumbnails (no lag)
        const imgEl = document.createElement('img');
        imgEl.className = 'wallpaper-thumb-media';
        imgEl.alt = wp.name || 'Wallpaper';
        imgEl.loading = 'lazy';
        imgEl.decoding = 'async';

        // For preset images use poster as placeholder while lazy-loading
        if (!isCustom && wp.poster) {
          imgEl.src = wp.poster;
        }

        thumb.appendChild(imgEl);

        // Play icon overlay for video wallpapers
        if (isVideo) {
          const playIcon = document.createElement('div');
          playIcon.className = 'wallpaper-thumb-play-icon';
          playIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
          thumb.appendChild(playIcon);
        }
      }

      // Label
      const label = document.createElement('span');
      label.className = 'wallpaper-thumb-label';
      label.textContent = wp.name || 'Custom Wallpaper';
      thumb.appendChild(label);

      // Wallpaper Selection Click Handler
      thumb.addEventListener('click', async () => {
        if (this.wallpaperEngine) {
          if (isCustom) {
            await this.wallpaperEngine.loadCustomWallpaperFromDB(wp.id);
          } else {
            this.wallpaperEngine.loadPresetWallpaper(wp.id);
          }
          await this.renderWallpaperOptions();
        }
      });

      grid.appendChild(thumb);
      if (!isShader) {
        this.thumbObserver.observe(thumb);
      }
    });
  }

  renderFontOptions() {
    const clockSelect = document.getElementById('clockFontSelect');
    const greetingSelect = document.getElementById('greetingFontSelect');
    const badge = document.getElementById('fontCountBadge');
    const chipsContainer = document.getElementById('customFontsChipsContainer');

    const customFonts = this.getCustomImportedFonts();
    if (badge) {
      badge.textContent = `${customFonts.length} / 4 Custom Fonts`;
    }

    const currentClockFont = localStorage.getItem('clock_font_family') || "'Outfit', sans-serif";
    const currentGreetingFont = localStorage.getItem('greeting_font_family') || "'Great Vibes', cursive";

    const fontOptions = [
      ...PRESET_FONTS.map(p => ({ label: p.name, value: p.family })),
      ...customFonts.map(f => ({ label: `${f} (Custom Online)`, value: `'${f}', sans-serif` }))
    ];

    if (clockSelect) {
      clockSelect.innerHTML = '';
      fontOptions.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        if (f.value === currentClockFont) opt.selected = true;
        clockSelect.appendChild(opt);
      });
    }

    if (greetingSelect) {
      greetingSelect.innerHTML = '';
      fontOptions.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        if (f.value === currentGreetingFont) opt.selected = true;
        greetingSelect.appendChild(opt);
      });
    }

    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      customFonts.forEach(fontName => {
        const chip = document.createElement('div');
        chip.className = 'font-chip';
        chip.innerHTML = `
          <span>${fontName}</span>
          <button type="button" class="font-chip-remove" title="Remove font">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        `;

        const removeBtn = chip.querySelector('.font-chip-remove');
        removeBtn.addEventListener('click', () => {
          const updated = this.getCustomImportedFonts().filter(f => f !== fontName);
          this.saveCustomImportedFonts(updated);
          this.renderFontOptions();
        });

        chipsContainer.appendChild(chip);
      });
    }
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
    const nameInput = document.getElementById('userDisplayNameInput');
    if (nameInput) {
      nameInput.value = localStorage.getItem('user_display_name') || '';
    }

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

    const cityInput = document.getElementById('weatherCityInput');
    if (cityInput) {
      const savedLoc = localStorage.getItem('user_weather_location');
      if (savedLoc) {
        try {
          const parsed = JSON.parse(savedLoc);
          cityInput.value = parsed.city || '';
        } catch (e) {}
      } else {
        cityInput.value = '';
      }
    }

    this.renderAccentColorSwatches();
    this.renderFontOptions();
  }
}
