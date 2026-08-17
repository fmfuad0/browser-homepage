/**
 * Wallpaper & Audio Engine
 * Supports high-performance WebGL procedural shaders, video loops, static images, ambient audio,
 * and persistent custom uploads using IndexedDB.
 */

import { ShaderEngine } from './shaderEngine.js';

export const MAX_CUSTOM_WALLPAPERS = 50;

export const PRESET_WALLPAPERS = [
  {
    id: 'shader-aurora',
    name: 'Cosmic Aurora',
    type: 'shader',
    shaderKey: 'aurora',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'shader-rain',
    name: 'Cyberpunk Rain',
    type: 'shader',
    shaderKey: 'rain',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b7e28ff0b.mp3?filename=rain-and-thunder-16705.mp3'
  },
  {
    id: 'shader-embers',
    name: 'Cozy Fireplace',
    type: 'shader',
    shaderKey: 'embers',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'shader-stars',
    name: 'Deep Space Stars',
    type: 'shader',
    shaderKey: 'stars',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=forest-birds-109033.mp3'
  },
  {
    id: 'serene-nature',
    name: 'Serene Nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=forest-birds-109033.mp3',
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  }
];

export class WallpaperEngine {
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId || 'backgroundContainer');
    this.audioBtn = document.getElementById(options.audioBtnId || 'audioToggleBtn');
    this.volumeSlider = document.getElementById(options.volumeSliderId || 'volumeSlider');
    this.bgMediaEl = null;
    this.shaderEngine = null;

    this.audioEl = new Audio();
    this.audioEl.loop = true;
    this.isPlayingAudio = false;

    this.activeWallpaper = null;
    this.db = null;

    // Track active blob URL for custom wallpapers to prevent leaks
    this.activeObjectUrl = null;
  }

  async init() {
    this.setupEventListeners();
    const savedId = localStorage.getItem('active_wallpaper_id') || 'shader-aurora';

    if (!savedId.startsWith('custom-')) {
      this.loadPresetWallpaper(savedId);
      this.initDB().catch(() => {});
    } else {
      this.initDB().then(() => this.loadCustomWallpaperFromDB(savedId)).catch(err => console.warn('Custom wallpaper IDB error:', err));
    }
  }

  initDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('BrowserHomepageDB', 3);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wallpapers')) {
          db.createObjectStore('wallpapers', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = () => resolve(null);
    });
  }

  setupEventListeners() {
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => this.toggleAudio());
    }

    if (this.volumeSlider) {
      const savedVol = localStorage.getItem('audio_volume') || '0.5';
      this.volumeSlider.value = savedVol;
      this.audioEl.volume = parseFloat(savedVol);

      this.volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        this.audioEl.volume = vol;
        localStorage.setItem('audio_volume', vol);
      });
    }
  }

  toggleAudio() {
    if (!this.audioEl.src) return;

    if (this.isPlayingAudio) {
      this.audioEl.pause();
      this.isPlayingAudio = false;
      if (this.audioBtn) this.audioBtn.classList.remove('playing');
    } else {
      this.audioEl.play().then(() => {
        this.isPlayingAudio = true;
        if (this.audioBtn) this.audioBtn.classList.add('playing');
      }).catch(err => console.warn('Audio play blocked:', err));
    }
  }

  loadPresetWallpaper(id) {
    let wp = PRESET_WALLPAPERS.find(w => w.id === id) || PRESET_WALLPAPERS[0];
    this.applyWallpaper(wp);
  }

  async loadCustomWallpaperFromDB(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    const customWp = await this._dbGet('wallpapers', id);
    if (!customWp) return;

    try {
      let fileBlob = customWp.blob;
      if (!fileBlob && customWp.handle) {
        const perm = await customWp.handle.queryPermission({ mode: 'read' });
        if (perm === 'granted' || (await customWp.handle.requestPermission({ mode: 'read' })) === 'granted') {
          fileBlob = await customWp.handle.getFile();
        }
      }

      if (fileBlob) {
        if (this.activeObjectUrl) {
          URL.revokeObjectURL(this.activeObjectUrl);
          this.activeObjectUrl = null;
        }
        this.activeObjectUrl = URL.createObjectURL(fileBlob);
        const resolvedWp = { ...customWp, url: this.activeObjectUrl };
        this.applyWallpaper(resolvedWp);
      }
    } catch (err) {
      console.warn('Failed to load custom wallpaper from storage:', err);
    }
  }

  applyWallpaper(wp) {
    this.activeWallpaper = wp;
    localStorage.setItem('active_wallpaper_id', wp.id);

    // Clean up active shader engine if present
    if (this.shaderEngine) {
      this.shaderEngine.destroy();
      this.shaderEngine = null;
    }

    // Release background video resources if previously present
    if (this.bgMediaEl && this.bgMediaEl.tagName === 'VIDEO') {
      this.bgMediaEl.pause();
      this.bgMediaEl.removeAttribute('src');
      this.bgMediaEl.load();
    }
    this.container.innerHTML = '';

    if (wp.type === 'shader') {
      this.shaderEngine = new ShaderEngine(this.container);
      const success = this.shaderEngine.init(wp.shaderKey || 'aurora');
      if (!success) {
        // Fallback to image preset if WebGL is unavailable
        this.loadPresetWallpaper('serene-nature');
        return;
      }
    } else if (wp.type === 'video') {
      const video = document.createElement('video');
      video.className = 'background-media';
      video.id = 'bgMedia';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.src = wp.url;
      if (wp.poster) video.poster = wp.poster;

      this.container.appendChild(video);
      this.bgMediaEl = video;
    } else {
      const img = document.createElement('img');
      img.className = 'background-media';
      img.id = 'bgMedia';
      img.src = wp.url;
      img.alt = 'Wallpaper';

      this.container.appendChild(img);
      this.bgMediaEl = img;
    }

    if (wp.audioUrl) {
      this.audioEl.src = wp.audioUrl;
    } else {
      this.audioEl.src = '';
    }

    const focusBlur = localStorage.getItem('search_focus_blur') || '12';
    document.documentElement.style.setProperty('--search-blur-amount', `${focusBlur}px`);
  }

  pauseShader() {
    if (this.shaderEngine) {
      this.shaderEngine.pause();
    }
  }

  resumeShader() {
    if (this.shaderEngine && this.activeWallpaper && this.activeWallpaper.type === 'shader') {
      this.shaderEngine.resume();
    }
  }

  static isSupportedMedia(filename, mimeType = '') {
    const ext = filename.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogv', 'mov', 'm4v'];
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];

    if (mimeType.startsWith('video/') || videoExts.includes(ext)) {
      return { supported: true, type: 'video' };
    }
    if (mimeType.startsWith('image/') || imageExts.includes(ext)) {
      return { supported: true, type: 'image' };
    }
    return { supported: false, type: null };
  }

  /**
   * Generate a JPEG thumbnail blob from a video file by seeking to 0.5s.
   * Returns a Blob or null if generation fails.
   */
  static generateVideoThumbnail(videoFile) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(videoFile);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = url;

      const cleanup = () => URL.revokeObjectURL(url);

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(0.5, video.duration || 0);
      }, { once: true });

      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 320;
          const scale = Math.min(1, maxW / (video.videoWidth || maxW));
          canvas.width = Math.round((video.videoWidth || maxW) * scale);
          canvas.height = Math.round((video.videoHeight || 180) * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => { cleanup(); resolve(blob); }, 'image/jpeg', 0.8);
        } catch (e) {
          cleanup();
          resolve(null);
        }
      }, { once: true });

      video.addEventListener('error', () => { cleanup(); resolve(null); }, { once: true });
      video.load();
    });
  }

  async saveCustomWallpaper(file) {
    const media = WallpaperEngine.isSupportedMedia(file.name, file.type);
    if (!media.supported) return null;
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    const existing = await this.getCustomWallpaperCount();
    if (existing >= MAX_CUSTOM_WALLPAPERS) {
      console.warn(`Maximum of ${MAX_CUSTOM_WALLPAPERS} custom wallpapers reached.`);
      return null;
    }

    const wpRecord = {
      id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: file.name,
      type: media.type,
      blob: file,
      timestamp: Date.now()
    };

    if (media.type === 'video') {
      const thumb = await WallpaperEngine.generateVideoThumbnail(file);
      if (thumb) wpRecord.thumbnailBlob = thumb;
    }

    await this._dbPut('wallpapers', wpRecord);
    await this.loadCustomWallpaperFromDB(wpRecord.id);
    return wpRecord;
  }

  async saveCustomFiles(files) {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    const fileArray = Array.from(files);
    const validRecords = [];

    const existing = await this.getCustomWallpaperCount();
    const remaining = MAX_CUSTOM_WALLPAPERS - existing;
    if (remaining <= 0) {
      alert(`Maximum of ${MAX_CUSTOM_WALLPAPERS} custom wallpapers reached. Remove some before adding more.`);
      return [];
    }

    const toProcess = fileArray.slice(0, remaining);

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      const media = WallpaperEngine.isSupportedMedia(file.name, file.type);
      if (media.supported) {
        const record = {
          id: 'custom-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: media.type,
          blob: file,
          timestamp: Date.now()
        };
        if (media.type === 'video') {
          const thumb = await WallpaperEngine.generateVideoThumbnail(file);
          if (thumb) record.thumbnailBlob = thumb;
        }
        validRecords.push(record);
      }
    }

    if (validRecords.length === 0) return [];

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      validRecords.forEach(rec => store.put(rec));
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });

    return validRecords;
  }

  async scanAndSaveDirectoryHandle(dirHandle) {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    const existing = await this.getCustomWallpaperCount();
    const remaining = MAX_CUSTOM_WALLPAPERS - existing;
    if (remaining <= 0) {
      alert(`Maximum of ${MAX_CUSTOM_WALLPAPERS} custom wallpapers reached. Remove some before adding more.`);
      return [];
    }

    const validRecords = [];
    let counter = 0;

    const scanDir = async (handle) => {
      for await (const entry of handle.values()) {
        if (validRecords.length >= remaining) break;

        if (entry.kind === 'file') {
          const media = WallpaperEngine.isSupportedMedia(entry.name);
          if (media.supported) {
            try {
              validRecords.push({
                id: 'custom-' + Date.now() + '-' + (counter++) + '-' + Math.random().toString(36).substring(2, 6),
                name: entry.name,
                type: media.type,
                handle: entry,
                timestamp: Date.now()
              });
            } catch (err) {
              console.warn('Skipping file from handle read error:', entry.name, err);
            }
          }
        } else if (entry.kind === 'directory') {
          await scanDir(entry);
        }
      }
    };

    await scanDir(dirHandle);

    if (validRecords.length === 0) return [];

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      validRecords.forEach(rec => store.put(rec));
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });

    return validRecords;
  }

  async getAllCustomWallpapers() {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readonly');
      const store = tx.objectStore('wallpapers');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []).map(wp => {
          const { blob, thumbnailBlob, ...meta } = wp;
          if (wp.type === 'image' && blob) {
            return { ...meta, blob };
          }
          if (wp.type === 'video' && thumbnailBlob) {
            return { ...meta, thumbnailBlob };
          }
          return meta;
        });
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  }

  async getCustomWallpaperById(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return null;
    return this._dbGet('wallpapers', id);
  }

  async getCustomWallpaperCount() {
    if (!this.db) await this.initDB();
    if (!this.db) return 0;
    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readonly');
      const store = tx.objectStore('wallpapers');
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }

  async deleteCustomWallpaper(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async clearAllCustomWallpapers() {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  _dbGet(storeName, key) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  _dbPut(storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }
}
